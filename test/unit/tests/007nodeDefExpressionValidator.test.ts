import type { ArenaSurvey } from '@openforis/arena-core'

import { getContextUser } from '../../integration/config/context'
import * as DataTest from '../../utils/dataTest'
import * as NodeDefExpressionUtils from '../../utils/nodeDefExpressionUtils'

let survey: ArenaSurvey = null

describe('NodeDefExpressionValidator Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = await DataTest.createTestSurvey({ user })
  }, 10000)

  // ======
  // expressions evaluated in the context of cluster_id, with self reference allowed
  const validExpressions = [
    // use of single attribute in context
    'cluster_id + 1',
    // use of different attributes
    'cluster_distance + cluster_id',
    // now function
    'visit_date <= now()',
    // isEmpty function
    'isEmpty(cluster_id)',
    // length property (multiple entities)
    'plot.length',
    // access multiple entities with index
    'plot[0].plot_id',
    // global objects
    'Math.min(plot[0].plot_id, plot[1].plot_id, plot[2].plot_id)',
    'Number.isFinite(plot[1].plot_id)',
    'String.fromCharCode(65, 66, 67)',
    // native properties (number)
    'Math.PI.toFixed(2)',
    'plot[0].tree[1].dbh.toFixed(1)',
    'plot[0].tree[1].dbh.toPrecision(4)',
    // native properties (string)
    'gps_model.toLowerCase()',
    'gps_model.substring(4,7)',
    'gps_model.length',
    // text search methods (supported in the Data Explorer filter)
    `gps_model.includes('abc')`,
    `gps_model.toLowerCase().startsWith('abc') && gps_model.endsWith('xyz')`,
    // global objects (constructors)
    'Boolean(cluster_id)',
    'Boolean(remarks)',
    'Date.parse(Date()) <= Date.now()',
    'Number(remarks)',
    'String(cluster_id)',
    // composite attributes
    'cluster_location.x',
    'cluster_location.srs',
    'plot[0].tree[0].tree_species.code',
    'plot[0].tree[0].tree_species.scientificName',
    'visit_date.year',
    'visit_date.month',
    'visit_date.day',
    'visit_time.hour',
    'visit_time.minute',
    'visit_time.seconds',
  ]

  const invalidExpressions = [
    // use of undefined attribute
    'cluster_idd + 1',
    // access of non-rechable nodes (descendant nodes)
    'plot_id + 10',
    // now function (with wrong parameters)
    'visit_date <= now(123)',
    // global objects
    'Number.isSomething(plot[1].plot_id)',
    'Strings(cluster_id)',
    // composite attributes
    'cluster_location.xyz',
    'visit_date.hour',
  ]

  /**
   * Other node def expr tests
   * query type:
   * - q: expression to test
   * - r: expected result (true = valid, false = not valid)
   * - n: node def name (default to cluster_id)
   * - s: self reference allowed (default to true).
   */
  const queries = [
    ...validExpressions.map((q) => ({ q, r: true })),
    ...invalidExpressions.map((q) => ({ q, r: false })),
    // referencing same attribute when not allowed (error expected)
    { q: 'cluster_id + 1', r: false, s: false },
    // access of non-rechable nodes (descendant nodes)
    { q: 'dbh + 10', n: 'plot_id', r: false },
    // length property (multiple attributes)
    { q: 'plot_multiple_number.length', n: 'plot_id', r: true },
    // index function
    { q: 'index(plot)', n: 'plot', r: true },
    { q: 'index(plot, plot_id)', n: 'plot', r: false },
    // access same attribute attribute in sibling entity (even when self reference is not allowed)
    { q: 'plot[index(plot) - 1].plot_id + 1', n: 'plot_id', r: true, s: false },
    // parent function
    { q: 'parent(plot_id)', n: 'plot_id', r: true },
  ]

  const expressionEvaluator = NodeDefExpressionUtils.nodeDefExpressionEvaluator({ surveyFn: () => survey })

  test.each(NodeDefExpressionUtils.toTestCases(queries))('%s', async (_title, query) => {
    const { actual, expected } = await NodeDefExpressionUtils.evaluateQuery({ query, expressionEvaluator })
    expect(actual).toEqual(expected)
  })
})
