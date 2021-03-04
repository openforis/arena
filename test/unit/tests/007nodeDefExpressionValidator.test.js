import * as DataTest from '../../utils/dataTest'
import * as NodeDefExpressionUtils from '../../utils/nodeDefExpressionUtils'

import { getContextUser } from '../../integration/config/context'

let survey = {}

describe('NodeDefExpressionValidator Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = DataTest.createTestSurvey({ user })
  }, 10000)

  // ======
  /**
   * Node def expr tests
   * query type:
   * - q: expression to test
   * - r: expected result (true = valid, false = not valid)
   * - n: node def name (default to cluster_id)
   * - s: self reference allowed (default to true).
   */
  const queries = [
    // use of single attribute in context
    { q: 'cluster_id + 1', r: true },
    // referencing same attribute when not allowed (error expected)
    { q: 'cluster_id + 1', r: false, s: false },
    // use of undefined attribute
    { q: 'cluster_idd + 1', r: false },
    // use of different attributes
    { q: 'cluster_distance + cluster_id', r: true },
    // access of non-rechable nodes (descendant nodes)
    { q: 'plot_id + 10', r: false },
    { q: 'dbh + 10', n: 'plot_id', r: false },
    // now function
    { q: 'visit_date <= now()', r: true },
    // now function (with wrong parameters)
    { q: 'visit_date <= now(123)', r: false },
    // isEmpty function
    { q: 'isEmpty(cluster_id)', r: true },
    // length property (multiple entities)
    { q: 'plot.length', r: true },
    // length property (multiple attributes)
    { q: 'plot_multiple_number.length', n: 'plot_id', r: true },
    // access multiple entities with index
    { q: 'plot[0].plot_id', r: true },
    // index function
    { q: 'index(plot)', n: 'plot', r: true },
    { q: 'index(plot, plot_id)', n: 'plot', r: false },
    // access same attribute attribute in sibling entity (even when self reference is not allowed)
    { q: 'plot[index(plot) - 1].plot_id + 1', n: 'plot_id', r: true, s: false },
    // parent function
    { q: 'parent(plot_id)', n: 'plot_id', r: true },
    // global objects
    { q: 'Math.min(plot[0].plot_id, plot[1].plot_id, plot[2].plot_id)', r: true },
    { q: 'Number.isFinite(plot[1].plot_id)', r: true },
    { q: 'Number.isSomething(plot[1].plot_id)', r: false },
    { q: 'String.fromCharCode(65, 66, 67)', r: true },
    // native properties (number)
    { q: 'Math.PI.toFixed(2)', r: true },
    { q: 'plot[0].tree[1].dbh.toFixed(1)', r: true },
    { q: 'plot[0].tree[1].dbh.toPrecision(4)', r: true },
    // native properties (string)
    { q: 'gps_model.toLowerCase()', r: true },
    { q: 'gps_model.substring(4,7)', r: true },
    { q: 'gps_model.length', r: true },
    // global objects (constructors)
    { q: 'Boolean(cluster_id)', r: true },
    { q: 'Boolean(remarks)', r: true },
    { q: 'Date.parse(Date()) <= Date.now()', r: true },
    { q: 'Number(remarks)', r: true },
    { q: 'String(cluster_id)', r: true },
    { q: 'Strings(cluster_id)', r: false },
    // composite attributes
    { q: 'cluster_location.x', r: true },
    { q: 'cluster_location.srs', r: true },
    { q: 'cluster_location.xyz', r: false },
    { q: 'plot[0].tree[0].tree_species.code', r: true },
    { q: 'plot[0].tree[0].tree_species.scientificName', r: true },
    { q: 'visit_date.year', r: true },
    { q: 'visit_date.month', r: true },
    { q: 'visit_date.day', r: true },
    { q: 'visit_date.hour', r: false },
    { q: 'visit_time.hour', r: true },
    { q: 'visit_time.minute', r: true },
    { q: 'visit_time.seconds', r: false },
  ]

  NodeDefExpressionUtils.testNodeDefExpressions({ surveyFn: () => survey, queries })
})
