/**
 * Record update performance benchmark (not part of the unit test suite).
 *
 * Builds surveys and records in memory and measures the time spent by the record update functions
 * (the ones used by data entry and data import), with small/big records and with few/many expressions.
 *
 * Run with: yarn test:perf
 * Options (env variables): PERF_UPDATE_ITERATIONS (default 30), PERF_OUTPUT_FILE (JSON results file),
 * PERF_SCENARIO (run only the scenarios whose name contains it, e.g. "big (1000 trees) / many").
 */
import fs from 'node:fs'
import path from 'node:path'

import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as SB from '../utils/surveyBuilder'
import * as SurveyUtils from '../utils/surveyUtils'

type Size = { name: string; plots: number; treesPerPlot: number }
type ExpressionsLevel = {
  name: string
  calculated: number
  applicable: number
  validations: number
  aggregates: boolean
}
type Stats = { median: number; mean: number; min: number; max: number }
type ScenarioResult = {
  scenario: string
  nodes: number
  buildTotalMs: number
  buildPerTreeMs: number
  aggregatesConsistent: boolean
  updateLeafAttribute: Stats
  updateDependedOnAttribute: Stats
  addTree: Stats
}

const arenaCoreVersion: string = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../node_modules/@openforis/arena-core/package.json'), 'utf8')
).version

const updateIterations = Number(process.env.PERF_UPDATE_ITERATIONS ?? 30)

const sizes: Size[] = [
  { name: 'small', plots: 1, treesPerPlot: 10 },
  { name: 'medium', plots: 5, treesPerPlot: 40 },
  { name: 'big', plots: 10, treesPerPlot: 100 },
]

const expressionsLevels: ExpressionsLevel[] = [
  { name: 'few-expressions', calculated: 0, applicable: 0, validations: 0, aggregates: false },
  { name: 'many-expressions', calculated: 10, applicable: 5, validations: 5, aggregates: true },
]

const user = {
  uuid: 'perf-test-user-uuid',
  name: 'Perf test',
  email: 'perf@openforis.org',
  hasProfilePicture: false,
  status: 'ACCEPTED',
  props: {},
  authGroups: [],
} as any

// category items and taxa are not used: no providers needed
const providers = { categoryItemProvider: null, taxonProvider: null, timezoneOffset: 0 }

const expr = (expression: string) => NodeDefExpression.createExpression({ expression })

const buildTreeChildren = (level: ExpressionsLevel) => {
  const children = [
    SB.attribute('tree_id', NodeDef.nodeDefType.integer).key(),
    SB.attribute('dbh', NodeDef.nodeDefType.decimal).expressions(
      ...Array.from({ length: level.validations }, (_v, i) => expr(`dbh > ${i}`))
    ),
    SB.attribute('height', NodeDef.nodeDefType.decimal),
    SB.attribute('notes', NodeDef.nodeDefType.text),
  ]
  // calculated attributes: a chain where each one depends on dbh and on the previous one
  for (let i = 0; i < level.calculated; i++) {
    const dependency = i === 0 ? 'dbh' : `dbh + calc_${i - 1}`
    children.push(
      SB.attribute(`calc_${i}`, NodeDef.nodeDefType.decimal)
        .readOnly()
        .defaultValues(expr(`${dependency} * ${i + 1}`))
    )
  }
  for (let i = 0; i < level.applicable; i++) {
    children.push(SB.attribute(`appl_${i}`, NodeDef.nodeDefType.decimal).applyIf(`dbh > ${i * 10}`))
  }
  return children
}

const buildPlotChildren = (level: ExpressionsLevel) => {
  const children = [SB.attribute('plot_id', NodeDef.nodeDefType.integer).key()]
  if (level.aggregates) {
    children.push(
      SB.attribute('plot_dbh_sum', NodeDef.nodeDefType.decimal).readOnly().defaultValues(expr('sum(tree.dbh)')),
      SB.attribute('plot_trees_count', NodeDef.nodeDefType.integer).readOnly().defaultValues(expr('count(tree)'))
    )
  }
  return children
}

const createSurvey = async (level: ExpressionsLevel) =>
  SB.survey(
    user,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
      SB.entity(
        'plot',
        ...buildPlotChildren(level),
        SB.entity('tree', ...buildTreeChildren(level)).multiple()
      ).multiple()
    )
  ).build()

const now = (): number => Number(process.hrtime.bigint()) / 1e6

const computeStats = (times: number[]): Stats => {
  const sorted = [...times].sort((a, b) => a - b)
  const round = (value: number) => Math.round(value * 1000) / 1000
  return {
    median: round(sorted[Math.floor(sorted.length / 2)]),
    mean: round(times.reduce((acc, time) => acc + time, 0) / times.length),
    min: round(sorted[0]),
    max: round(sorted.at(-1)),
  }
}

const createContext = async (level: ExpressionsLevel) => {
  const survey = await createSurvey(level)
  const defUuid = (path: string) => SurveyUtils.getNodeDefByPath({ survey, path }).uuid
  return {
    survey,
    plotDefUuid: defUuid('cluster/plot'),
    treeDefUuid: defUuid('cluster/plot/tree'),
    clusterIdDefUuid: defUuid('cluster/cluster_id'),
    plotIdDefUuid: defUuid('cluster/plot/plot_id'),
    treeIdDefUuid: defUuid('cluster/plot/tree/tree_id'),
    dbhDefUuid: defUuid('cluster/plot/tree/dbh'),
    heightDefUuid: defUuid('cluster/plot/tree/height'),
    notesDefUuid: defUuid('cluster/plot/tree/notes'),
    plotTreesCountDefUuid: level.aggregates ? defUuid('cluster/plot/plot_trees_count') : null,
    plotDbhSumDefUuid: level.aggregates ? defUuid('cluster/plot/plot_dbh_sum') : null,
  }
}

type Context = Awaited<ReturnType<typeof createContext>>

// updates (or creates) a plot or a tree: same function used by data import (and, through updateNodesDependents, by data entry)
const updateEntity = async ({
  context,
  record,
  plotId,
  treeId = null,
  values = {},
  insertMissingNodes = false,
}: {
  context: Context
  record: any
  plotId: number
  treeId?: number | null
  values?: { [defUuid: string]: unknown }
  insertMissingNodes?: boolean
}) =>
  Record.updateAttributesWithValues({
    user,
    survey: context.survey,
    // without treeId: update (or create) the plot
    entityDefUuid: treeId === null ? context.plotDefUuid : context.treeDefUuid,
    valuesByDefUuid: {
      [context.clusterIdDefUuid]: 1,
      [context.plotIdDefUuid]: plotId,
      ...(treeId === null ? {} : { [context.treeIdDefUuid]: treeId }),
      ...values,
    },
    insertMissingNodes,
    ...providers,
    sideEffect: true,
  })(record)

const buildRecord = async ({ context, size }: { context: Context; size: Size }) => {
  const { record: recordWithRoot } = await Record.createRootEntity({
    user,
    survey: context.survey,
    record: Record.newRecord(user, '0') as any,
    sideEffect: true,
  })
  const { record: recordWithRootKey } = await Record.updateAttributesInEntityWithValues({
    user,
    survey: context.survey,
    entity: Record.getRootNode(recordWithRoot),
    valuesByDefUuid: { [context.clusterIdDefUuid]: 1 },
    ...providers,
    sideEffect: true,
  })(recordWithRoot)
  let record = recordWithRootKey
  for (let plotId = 1; plotId <= size.plots; plotId++) {
    const plotParams = { context, record, plotId, insertMissingNodes: true }
    const { record: recordWithPlot } = await updateEntity(plotParams) // NOSONAR: sequential, uses the previous record
    record = recordWithPlot
    for (let treeId = 1; treeId <= size.treesPerPlot; treeId++) {
      const values = { [context.dbhDefUuid]: treeId, [context.heightDefUuid]: treeId * 2 }
      const updateParams = { context, record, plotId, treeId, values, insertMissingNodes: true }
      const { record: recordUpdated } = await updateEntity(updateParams) // NOSONAR: sequential, uses the previous record
      record = recordUpdated
    }
  }
  return record
}

const measureUpdates = async ({
  context,
  record: recordParam,
  size,
  valuesGenerator,
}: {
  context: Context
  record: any
  size: Size
  valuesGenerator: (iteration: number) => { treeId: number; values: { [defUuid: string]: unknown } }
}) => {
  let record = recordParam
  const times: number[] = []
  for (let iteration = 0; iteration < updateIterations; iteration++) {
    const plotId = (iteration % size.plots) + 1
    const { treeId, values } = valuesGenerator(iteration)
    const updateParams = { context, record, plotId, treeId, values, insertMissingNodes: true }
    const start = now()
    const { record: recordUpdated } = await updateEntity(updateParams) // NOSONAR: sequential, timed one by one
    times.push(now() - start)
    record = recordUpdated
  }
  return { record, stats: computeStats(times) }
}

// checks that the plot aggregates (count/sum of trees) have been kept up to date by the record updates
const areAggregatesConsistent = ({ context, record }: { context: Context; record: any }): boolean => {
  if (!context.plotTreesCountDefUuid) return true
  const childValue = (parentNode: any, defUuid: string) =>
    Node.getValue(Record.getNodeChildByDefUuid(parentNode, defUuid)(record))
  const plots = Record.getNodeChildrenByDefUuid(Record.getRootNode(record), context.plotDefUuid)(record)
  return plots.every((plot: any) => {
    const trees = Record.getNodeChildrenByDefUuid(plot, context.treeDefUuid)(record)
    const dbhSum = trees.reduce((acc: number, tree: any) => acc + Number(childValue(tree, context.dbhDefUuid)), 0)
    return (
      Number(childValue(plot, context.plotTreesCountDefUuid)) === trees.length &&
      Number(childValue(plot, context.plotDbhSumDefUuid)) === dbhSum
    )
  })
}

const runScenario = async ({ size, level }: { size: Size; level: ExpressionsLevel }): Promise<ScenarioResult> => {
  const context = await createContext(level)

  const buildStart = now()
  let record = await buildRecord({ context, size })
  const buildTotalMs = now() - buildStart
  const treesCount = size.plots * size.treesPerPlot

  const middleTreeId = Math.ceil(size.treesPerPlot / 2)

  // attribute without dependents
  const leafResult = await measureUpdates({
    context,
    record,
    size,
    valuesGenerator: (iteration) => ({ treeId: middleTreeId, values: { [context.notesDefUuid]: `note ${iteration}` } }),
  })
  record = leafResult.record

  // attribute with dependents (calculated attributes, applicability, validations, plot aggregates)
  const dependedOnResult = await measureUpdates({
    context,
    record,
    size,
    valuesGenerator: (iteration) => ({ treeId: middleTreeId, values: { [context.dbhDefUuid]: 100 + iteration } }),
  })
  record = dependedOnResult.record

  // new tree entity (node creation + dependents)
  const addTreeResult = await measureUpdates({
    context,
    record,
    size,
    valuesGenerator: (iteration) => ({
      treeId: size.treesPerPlot + 1 + iteration,
      values: { [context.dbhDefUuid]: 10 + iteration },
    }),
  })

  return {
    scenario: getScenarioName({ size, level }),
    nodes: Object.keys(Record.getNodes(addTreeResult.record)).length,
    buildTotalMs: Math.round(buildTotalMs),
    buildPerTreeMs: Math.round((buildTotalMs / treesCount) * 1000) / 1000,
    aggregatesConsistent: areAggregatesConsistent({ context, record: addTreeResult.record }),
    updateLeafAttribute: leafResult.stats,
    updateDependedOnAttribute: dependedOnResult.stats,
    addTree: addTreeResult.stats,
  }
}

const getScenarioName = ({ size, level }: { size: Size; level: ExpressionsLevel }) =>
  `${size.name} (${size.plots * size.treesPerPlot} trees) / ${level.name}`

const isScenarioSelected = ({ size, level }: { size: Size; level: ExpressionsLevel }) =>
  !process.env.PERF_SCENARIO || getScenarioName({ size, level }).includes(process.env.PERF_SCENARIO)

const printResults = (results: ScenarioResult[]) => {
  const rows = results.map((result) => ({
    scenario: result.scenario,
    nodes: result.nodes,
    'build total (ms)': result.buildTotalMs,
    'build per tree (ms)': result.buildPerTreeMs,
    'update leaf median (ms)': result.updateLeafAttribute.median,
    'update dbh median (ms)': result.updateDependedOnAttribute.median,
    'add tree median (ms)': result.addTree.median,
    'aggregates ok': result.aggregatesConsistent,
  }))
  process.stdout.write(`\nRecord update benchmark - arena-core ${arenaCoreVersion}\n`)
  // eslint-disable-next-line no-console
  console.table(rows)
}

describe('Record update performance', () => {
  it('measures record build and update times', async () => {
    const results: ScenarioResult[] = []
    for (const level of expressionsLevels) {
      for (const size of sizes) {
        if (isScenarioSelected({ size, level })) {
          results.push(await runScenario({ size, level })) // NOSONAR: scenarios timed one by one
        }
      }
    }
    printResults(results)

    const outputFile = process.env.PERF_OUTPUT_FILE
    if (outputFile) {
      fs.writeFileSync(outputFile, JSON.stringify({ arenaCoreVersion, results }, null, 2))
    }
    // sanity check only: timings are reported, not asserted (wall-clock assertions are flaky)
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((result) => result.aggregatesConsistent)).toBe(true)
  }, 600000)
})
