/**
 * Record update benchmark on a real survey export (survey.json + categories + taxonomies), in memory.
 * Written for the NFI MNE survey (cluster/plot/stems...): entity and attribute names below refer to it.
 * Env: PERF_SURVEY_DIR (extracted survey export, required), PERF_SIZES (comma separated: small,medium,big,huge),
 * PERF_UPDATE_ITERATIONS (default 20), PERF_OUTPUT_FILE, PERF_BUILD_ONLY, PERF_WARMUP, PERF_DUMP_FILE.
 */
import fs from 'node:fs'
import path from 'node:path'

import { RecordValidator } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as Validation from '@core/validation/validation'

const surveyDir = process.env.PERF_SURVEY_DIR as string
const updateIterations = Number(process.env.PERF_UPDATE_ITERATIONS ?? 20)

const arenaCoreVersion: string = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../node_modules/@openforis/arena-core/package.json'), 'utf8')
).version

const user = {
  uuid: 'perf-test-user-uuid',
  name: 'Perf test',
  email: 'perf@openforis.org',
  hasProfilePicture: false,
  status: 'ACCEPTED',
  props: {},
  authGroups: [],
} as any

type Counts = { [entityName: string]: number }
type Size = { name: string; counts: Counts }

const sizesAll: Size[] = [
  {
    name: 'small',
    counts: {
      plot: 1,
      stems: 20,
      ldwd_pieces: 5,
      auxiliary_navigation_objects: 2,
      regeneration_survey: 2,
      rstems: 5,
      vegetation_survey: 2,
      veg_layer_tree: 3,
      veg_layer_shrub: 3,
      soil_sample: 2,
    },
  },
  {
    name: 'medium',
    counts: {
      plot: 2,
      stems: 100,
      ldwd_pieces: 15,
      auxiliary_navigation_objects: 3,
      regeneration_survey: 3,
      rstems: 10,
      vegetation_survey: 2,
      veg_layer_tree: 5,
      veg_layer_shrub: 5,
      soil_sample: 3,
    },
  },
  {
    name: 'big',
    counts: {
      plot: 4,
      stems: 250,
      ldwd_pieces: 30,
      auxiliary_navigation_objects: 4,
      regeneration_survey: 4,
      rstems: 20,
      vegetation_survey: 3,
      veg_layer_tree: 10,
      veg_layer_shrub: 10,
      soil_sample: 4,
    },
  },
  {
    name: 'huge',
    counts: {
      plot: 2,
      stems: 1000,
      ldwd_pieces: 50,
      auxiliary_navigation_objects: 4,
      regeneration_survey: 4,
      rstems: 30,
      vegetation_survey: 3,
      veg_layer_tree: 10,
      veg_layer_shrub: 10,
      soil_sample: 4,
    },
  },
]
const sizes = sizesAll.filter((s) => (process.env.PERF_SIZES ?? 'small,medium,big').split(',').includes(s.name))

// deterministic PRNG (mulberry32): same data for every version
const createRandom = (seed: number) => {
  let a = seed
  return () => {
    a = Math.trunc(a + 0x6d2b79f5)
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const readJson = (...parts: string[]) => JSON.parse(fs.readFileSync(path.join(surveyDir, ...parts), 'utf8'))

const loadSurvey = async () => {
  const surveyJson = readJson('survey.json')
  const categoryItemsRefData: any[] = []
  const itemsByUuid: { [uuid: string]: any } = {}
  for (const category of Object.values<any>(surveyJson.categories)) {
    const levelIndexByUuid = Object.fromEntries(Object.values<any>(category.levels).map((l) => [l.uuid, l.index]))
    const items = readJson('categories', `${category.uuid}.json`)
    for (const item of items) {
      const itemRefData = { ...item, categoryUuid: category.uuid, levelIndex: levelIndexByUuid[item.levelUuid] }
      categoryItemsRefData.push(itemRefData)
      itemsByUuid[item.uuid] = itemRefData
    }
  }
  const taxaIndexRefData: any[] = []
  for (const taxonomy of Object.values<any>(surveyJson.taxonomies)) {
    taxaIndexRefData.push(...readJson('taxonomies', `${taxonomy.uuid}.json`))
  }
  // indexes and dependency graph rebuilt by the current version
  const surveyBase = { ...surveyJson }
  delete surveyBase.dependencyGraph
  delete surveyBase.nodeDefsIndex
  delete surveyBase.refData
  let survey = Survey.assocRefData({ categoryItemsRefData, taxaIndexRefData })(surveyBase)
  survey = Survey.initAndAssocNodeDefsIndex(survey)
  survey = await Survey.buildAndAssocDependencyGraph(survey)
  return { survey, categoryItemsRefData, itemsByUuid, taxaIndexRefData }
}

type Loaded = Awaited<ReturnType<typeof loadSurvey>>

const createProviders = (loaded: Loaded) => {
  const { categoryItemsRefData, itemsByUuid, taxaIndexRefData } = loaded
  const childItems = (categoryUuid: string, parentUuid: string | null) =>
    categoryItemsRefData.filter(
      (i) => i.categoryUuid === categoryUuid && (i.parentUuid ?? null) === (parentUuid ?? null)
    )
  const categoryItemProvider = {
    getItemByUuid: ({ itemUuid }: any) => Promise.resolve(itemsByUuid[itemUuid]),
    getItems: ({ categoryUuid, parentItemUuid = null }: any) =>
      Promise.resolve(childItems(categoryUuid, parentItemUuid)),
    getItemByCode: ({ categoryUuid, parentItemUuid = null, code }: any) =>
      Promise.resolve(childItems(categoryUuid, parentItemUuid).find((i) => i.props.code === code)),
    getItemByCodePaths: ({ categoryUuid, codePaths }: any) => {
      let parentUuid: string | null = null
      let item: any
      for (const code of codePaths) {
        item = childItems(categoryUuid, parentUuid).find((i) => i.props.code === code)
        if (!item) return Promise.resolve(undefined)
        parentUuid = item.uuid
      }
      return item
    },
  }
  const taxonProvider = {
    getTaxonByUuid: ({ taxonUuid }: any) => Promise.resolve(taxaIndexRefData.find((t) => t.uuid === taxonUuid)),
    getTaxonByCode: ({ taxonomyUuid, taxonCode }: any) =>
      Promise.resolve(taxaIndexRefData.find((t) => t.taxonomyUuid === taxonomyUuid && t.props.code === taxonCode)),
  }
  return { categoryItemProvider, taxonProvider, timezoneOffset: 0 }
}

const createContext = async () => {
  const loaded = await loadSurvey()
  const { survey, categoryItemsRefData, taxaIndexRefData } = loaded
  const providers = createProviders(loaded)
  const defByName = (name: string) => Survey.getNodeDefByName(name)(survey)
  const itemsByCategoryAndParent: { [key: string]: any[] } = {}
  for (const item of categoryItemsRefData) {
    const key = `${item.categoryUuid}|${item.parentUuid ?? ''}`
    itemsByCategoryAndParent[key] ??= []
    itemsByCategoryAndParent[key].push(item)
  }
  const taxaByTaxonomy: { [uuid: string]: any[] } = {}
  for (const taxon of taxaIndexRefData) {
    taxaByTaxonomy[taxon.taxonomyUuid] ??= []
    taxaByTaxonomy[taxon.taxonomyUuid].push(taxon)
  }
  return { ...loaded, providers, defByName, itemsByCategoryAndParent, taxaByTaxonomy }
}

type Context = Awaited<ReturnType<typeof createContext>>
type ChosenItems = { [defUuid: string]: string }

const candidateItems = ({
  context,
  nodeDef,
  chosenItems,
}: {
  context: Context
  nodeDef: any
  chosenItems: ChosenItems
}) => {
  const parentCodeDefUuid = NodeDef.getParentCodeDefUuid(nodeDef)
  const parentItemUuid = parentCodeDefUuid ? chosenItems[parentCodeDefUuid] : null
  if (parentCodeDefUuid && !parentItemUuid) return []
  return context.itemsByCategoryAndParent[`${NodeDef.getCategoryUuid(nodeDef)}|${parentItemUuid ?? ''}`] ?? []
}

const pick = <T>(random: () => number, items: T[]): T => items[Math.floor(random() * items.length)]

const generateValue = ({ context, nodeDef, chosenItems, random }: any): any => {
  switch (NodeDef.getType(nodeDef)) {
    case NodeDef.nodeDefType.integer:
      return 1 + Math.floor(random() * 100)
    case NodeDef.nodeDefType.decimal:
      return Math.round(random() * 10000) / 100
    case NodeDef.nodeDefType.text:
      return `text ${Math.floor(random() * 1000)}`
    case NodeDef.nodeDefType.boolean:
      return random() < 0.5 ? 'true' : 'false'
    case NodeDef.nodeDefType.code: {
      const items = candidateItems({ context, nodeDef, chosenItems })
      if (items.length === 0) return undefined
      const item = pick(random, items)
      chosenItems[NodeDef.getUuid(nodeDef)] = item.uuid
      return { itemUuid: item.uuid }
    }
    case NodeDef.nodeDefType.taxon: {
      const taxa: any[] = context.taxaByTaxonomy[NodeDef.getTaxonomyUuid(nodeDef)] ?? []
      return taxa.length > 0 ? { taxonUuid: pick(random, taxa).uuid } : undefined
    }
    case NodeDef.nodeDefType.coordinate:
      return { x: 19 + random(), y: 42 + random(), srs: '4326' }
    default:
      return undefined // file, date, time... not filled
  }
}

const isFillableAttribute = (nodeDef: any) =>
  !NodeDef.isEntity(nodeDef) &&
  !NodeDef.isKey(nodeDef) &&
  !NodeDef.isReadOnly(nodeDef) &&
  !NodeDef.isAnalysis(nodeDef) &&
  !NodeDef.isDeleted(nodeDef)

// parent code attributes before their dependent code attributes
const sortByCodeHierarchy = (defs: any[]) => {
  const sorted: any[] = []
  const visit = (def: any) => {
    if (sorted.includes(def)) return
    const parentUuid = NodeDef.getParentCodeDefUuid(def)
    const parent = parentUuid && defs.find((d) => NodeDef.getUuid(d) === parentUuid)
    if (parent) visit(parent)
    sorted.push(def)
  }
  for (const def of defs) visit(def)
  return sorted
}

const generateKeyValues = ({ context, entityDef, index, chosenItems }: any) => {
  const keyValues: { [defUuid: string]: any } = {}
  for (const keyDef of Survey.getNodeDefKeys(entityDef)(context.survey)) {
    const keyDefUuid = NodeDef.getUuid(keyDef)
    if (NodeDef.isCode(keyDef)) {
      const items = candidateItems({ context, nodeDef: keyDef, chosenItems })
      if (index >= items.length) return null
      keyValues[keyDefUuid] = { itemUuid: items[index].uuid }
      chosenItems[keyDefUuid] = items[index].uuid
    } else if (NodeDef.isTaxon(keyDef)) {
      const taxa = context.taxaByTaxonomy[NodeDef.getTaxonomyUuid(keyDef)] ?? []
      if (index >= taxa.length) return null
      keyValues[keyDefUuid] = { taxonUuid: taxa[index].uuid }
    } else {
      keyValues[keyDefUuid] = index + 1
    }
  }
  return keyValues
}

const updateWithValues = async ({ context, record, entityDefUuid, valuesByDefUuid, sideEffect }: any) => {
  const { record: recordUpdated } = await Record.updateAttributesWithValues({
    user,
    survey: context.survey,
    entityDefUuid,
    valuesByDefUuid,
    insertMissingNodes: true,
    ...context.providers,
    sideEffect,
  })(record)
  return recordUpdated
}

const generateEntityValues = ({ context, entityDef, chosenItems, random }: any) => {
  const attrDefs = sortByCodeHierarchy(
    (Survey.getNodeDefChildren as any)({ nodeDef: entityDef })(context.survey).filter((d: any) =>
      isFillableAttribute(d)
    )
  )
  const values: { [defUuid: string]: any } = {}
  for (const attrDef of attrDefs) {
    const value = generateValue({ context, nodeDef: attrDef, chosenItems, random })
    if (value !== undefined) values[NodeDef.getUuid(attrDef)] = value
  }
  return values
}

// fills an entity (already identified by the ancestor keys) and its descendant entities, like a data import
const fillEntity = async ({
  context,
  record: recordParam,
  entityDef,
  ancestorKeys,
  chosenItems,
  counts,
  random,
  stats,
}: any): Promise<any> => {
  const entityDefUuid = NodeDef.getUuid(entityDef)
  const values = generateEntityValues({ context, entityDef, chosenItems, random })
  let record = await updateWithValues({
    context,
    record: recordParam,
    entityDefUuid,
    valuesByDefUuid: { ...ancestorKeys, ...values },
    sideEffect: true,
  })
  const childEntityDefs = (Survey.getNodeDefChildren as any)({ nodeDef: entityDef })(context.survey).filter(
    (d: any) => NodeDef.isEntity(d) && !NodeDef.isDeleted(d)
  )
  for (const childDef of childEntityDefs) {
    const count = NodeDef.isMultiple(childDef) ? (counts[NodeDef.getName(childDef)] ?? 1) : 1
    for (let index = 0; index < count; index++) {
      const childChosenItems = { ...chosenItems }
      const keyValues = generateKeyValues({ context, entityDef: childDef, index, chosenItems: childChosenItems })
      if (!keyValues) break
      const fillParams = {
        context,
        record,
        entityDef: childDef,
        ancestorKeys: { ...ancestorKeys, ...keyValues },
        chosenItems: childChosenItems,
        counts,
        random,
        stats,
      }
      const start = now()
      record = await fillEntity(fillParams) // NOSONAR: entities filled one by one, using the previous record
      const childDefName = NodeDef.getName(childDef)
      stats[childDefName] ??= []
      stats[childDefName].push(now() - start)
    }
  }
  return record
}

const now = (): number => Number(process.hrtime.bigint()) / 1e6

const round = (value: number) => Math.round(value * 100) / 100

const median = (times: number[]) => {
  const sorted = [...times].sort((a, b) => a - b)
  return round(sorted[Math.floor(sorted.length / 2)])
}

const buildRecord = async ({ context, size, random, stats }: any) => {
  const rootDef = Survey.getNodeDefRoot(context.survey)
  const { record: recordWithRoot } = await Record.createRootEntity({
    user,
    survey: context.survey,
    record: Record.newRecord(user, '0') as any,
    sideEffect: true,
  })
  const chosenItems: ChosenItems = {}
  const rootKeys = generateKeyValues({ context, entityDef: rootDef, index: 0, chosenItems })
  return fillEntity({
    context,
    record: recordWithRoot,
    entityDef: rootDef,
    ancestorKeys: rootKeys,
    chosenItems,
    counts: size.counts,
    random,
    stats,
  })
}

const getKeysPath = ({ context, record, entity }: any) => {
  // ancestor keys (and own keys) of the given entity, as valuesByDefUuid
  const keys: { [defUuid: string]: any } = {}
  let current = entity
  while (current) {
    const def = Survey.getNodeDefByUuid(Node.getNodeDefUuid(current))(context.survey)
    for (const keyDef of Survey.getNodeDefKeys(def)(context.survey)) {
      const keyNode = Record.getNodeChildByDefUuid(current, NodeDef.getUuid(keyDef))(record)
      keys[NodeDef.getUuid(keyDef)] = Node.getValue(keyNode)
    }
    const parentUuid = Node.getParentUuid(current)
    current = parentUuid ? Record.getNodes(record)[parentUuid] : null
  }
  return keys
}

const findEntities = ({ context, record, name }: any) => {
  const defUuid = NodeDef.getUuid(context.defByName(name))
  return Object.values<any>(Record.getNodes(record)).filter((n) => Node.getNodeDefUuid(n) === defUuid)
}

// times updates of one attribute like data entry does: node value update, then dependents and validation (immutable record)
const measureAttributeUpdate = async ({ context, record, entityName, attributeName, valueGenerator }: any) => {
  const entities = findEntities({ context, record, name: entityName })
  const entity = entities[Math.floor(entities.length / 2)]
  const attrDefUuid = NodeDef.getUuid(context.defByName(attributeName))
  const times: number[] = []
  let current = record
  for (let i = 0; i < updateIterations; i++) {
    const attribute = Record.getNodeChildByDefUuid(entity, attrDefUuid)(current)
    const attributeUpdated = Node.assocValue(valueGenerator(i, attrDefUuid, attribute))(attribute)
    const nodes = { [Node.getUuid(attributeUpdated)]: attributeUpdated }
    const start = now()
    const recordWithNode = Record.assocNode(attributeUpdated)(current)
    const updateParams = { user, survey: context.survey, record: recordWithNode, nodes, ...context.providers }
    const { record: recordUpdated } = await Record.afterNodesUpdate(updateParams) // NOSONAR: updates timed one by one
    times.push(now() - start)
    current = recordUpdated
  }
  return { record: current, median: median(times) }
}

const alternateCodeGenerator = (context: Context) => (i: number, attrDefUuid: string, attribute: any) => {
  const attrDef = Survey.getNodeDefByUuid(attrDefUuid)(context.survey)
  const currentItem = context.itemsByUuid[Node.getValue(attribute)?.itemUuid]
  const siblings =
    context.itemsByCategoryAndParent[`${NodeDef.getCategoryUuid(attrDef)}|${currentItem?.parentUuid ?? ''}`]
  return { itemUuid: siblings[i % siblings.length].uuid }
}

// order independent checksum of values and applicability: same data and same evaluation results in every version
const recordFingerprint = ({ context, record }: any) => {
  let filled = 0
  let notApplicable = 0
  let checksum = 0
  const hash = (text: string) => {
    let h = 0
    for (let i = 0; i < text.length; i++) h = Math.imul(31, h) + (text.codePointAt(i) ?? 0)
    return h >>> 0
  }
  for (const node of Object.values<any>(Record.getNodes(record))) {
    const def = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(context.survey)
    if (NodeDef.isEntity(def)) {
      for (const childDef of (Survey.getNodeDefChildren as any)({ nodeDef: def })(context.survey)) {
        if (!Node.isChildApplicable(NodeDef.getUuid(childDef))(node)) notApplicable++
      }
    } else if (!Node.isValueBlank(node)) {
      filled++
      const valueText = JSON.stringify(Node.getValue(node))
      // timestamps (now()) differ at every run
      if (!/^"\d{4}-\d{2}-\d{2}T/.test(valueText))
        checksum = (checksum + hash(`${NodeDef.getName(def)}=${valueText}`)) % 1e9
    }
  }
  return `${filled}/${notApplicable}/${checksum}`
}

const runSize = async ({ context, size }: { context: Context; size: Size }) => {
  const random = createRandom(42)
  const stats: { [name: string]: number[] } = {}
  const buildStart = now()
  let record = await buildRecord({ context, size, random, stats })
  const buildMs = now() - buildStart
  const nodesCount = Object.keys(Record.getNodes(record)).length
  if (process.env.PERF_DUMP_FILE) {
    const valuesByName: { [name: string]: string[] } = {}
    for (const node of Object.values<any>(Record.getNodes(record))) {
      const def = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(context.survey)
      if (!NodeDef.isEntity(def)) {
        const name = NodeDef.getName(def)
        valuesByName[name] ??= []
        valuesByName[name].push(JSON.stringify(Node.getValue(node) ?? null))
      }
    }
    const compare = (a: string, b: string) => a.localeCompare(b)
    const names = Object.keys(valuesByName)
    names.sort(compare)
    const lines = names.map((name) => `${name}: ${[...valuesByName[name]].sort(compare).join(' ')}`)
    fs.writeFileSync(`${process.env.PERF_DUMP_FILE}.${size.name}`, lines.join('\n'))
  }

  const validationStart = now()
  const validation = await RecordValidator.validateRecord({
    survey: context.survey,
    record,
    ...context.providers,
  } as any)
  const validateRecordMs = now() - validationStart

  const results: any = {
    size: size.name,
    nodes: nodesCount,
    fingerprint: recordFingerprint({ context, record }),
    stems: findEntities({ context, record, name: 'stems' }).length,
    buildMs: Math.round(buildMs),
    stemMedianMs: median(stats.stems),
    stemsLast10MedianMs: median(stats.stems.slice(-10)),
    plotMedianMs: median(stats.plot),
    validateRecordMs: Math.round(validateRecordMs),
    recordValid: Validation.isValid(validation),
    invalidFields: Object.values<any>(Validation.getFieldValidations(validation)).filter((v) => !Validation.isValid(v))
      .length,
  }
  if (process.env.PERF_BUILD_ONLY === 'true') return results
  const updates = [
    ['updateStemNote', 'stems', 'stem_note', (i: number) => `note ${i}`],
    ['updateStemDbh', 'stems', 'first_dbh_cm', (i: number) => 10 + i],
    ['updateStemPopulation', 'stems', 'stem_population', alternateCodeGenerator(context)],
    ['updatePlotLuseSubclass', 'plot_center', 'luse_subclass', alternateCodeGenerator(context)],
  ] as const
  for (const [label, entityName, attributeName, valueGenerator] of updates) {
    const res = await measureAttributeUpdate({ context, record, entityName, attributeName, valueGenerator }) // NOSONAR: sequential
    record = res.record
    results[`${label}MedianMs`] = res.median
  }
  // add stems to the first plot (all attributes filled, like a data import row)
  const plot = findEntities({ context, record, name: 'plot' })[0]
  const plotKeys = getKeysPath({ context, record, entity: plot })
  const stemsDef = context.defByName('stems')
  const stemIdDefUuid = NodeDef.getUuid(context.defByName('stem_id'))
  const existingStems = Record.getNodeChildrenByDefUuid(
    Record.getNodeChildByDefUuid(plot, NodeDef.getUuid(context.defByName('stems_registration')))(record),
    NodeDef.getUuid(stemsDef)
  )(record).length
  const addTimes: number[] = []
  for (let i = 0; i < updateIterations; i++) {
    const values = generateEntityValues({ context, entityDef: stemsDef, chosenItems: {}, random })
    const valuesByDefUuid = { ...plotKeys, [stemIdDefUuid]: existingStems + i + 1, ...values }
    const addParams = { context, record, entityDefUuid: NodeDef.getUuid(stemsDef), valuesByDefUuid, sideEffect: false }
    const start = now()
    record = await updateWithValues(addParams) // NOSONAR: stems added and timed one by one
    addTimes.push(now() - start)
  }
  results.addStemMedianMs = median(addTimes)
  results.finalFingerprint = recordFingerprint({ context, record })
  return results
}

const describeIfSurvey = surveyDir ? describe : describe.skip

describeIfSurvey('Survey records performance', () => {
  it('measures record build and update times', async () => {
    const loadStart = now()
    const context = await createContext()
    const surveyLoadMs = Math.round(now() - loadStart)
    const results = []
    if (process.env.PERF_WARMUP !== 'false') await runSize({ context, size: sizesAll[0] }) // JIT warm up
    for (const size of sizes) {
      results.push(await runSize({ context, size })) // NOSONAR
      process.stdout.write(`done ${size.name}: ${JSON.stringify(results.at(-1))}\n`)
    }
    process.stdout.write(
      `\nSurvey records benchmark - arena-core ${arenaCoreVersion} - survey load ${surveyLoadMs} ms\n`
    )
    // eslint-disable-next-line no-console
    console.table(results)
    if (process.env.PERF_OUTPUT_FILE) {
      fs.writeFileSync(
        process.env.PERF_OUTPUT_FILE,
        JSON.stringify({ arenaCoreVersion, surveyLoadMs, results }, null, 2)
      )
    }
    expect(results.length).toBeGreaterThan(0)
  }, 3600000)
})
