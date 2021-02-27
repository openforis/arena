import * as DataTest from '../../utils/dataTest'
import * as NodeDefExpressionUtils from '../../utils/nodeDefExpressionUtils'

import { getContextUser } from '../../integration/config/context'

let survey = {}

describe('NodeDefExpressionValidator Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = DataTest.createTestSurvey({ user })
  }, 10000)

  // ====== node def expr tests
  const queries = [
    // use of single attribute in context
    { q: 'cluster_id + 1', r: true },
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
    // access attribute of sibling entity
    { q: 'plot[index(plot) - 1].plot_id', n: 'plot_id', r: true },
    { q: 'plot[index(plot) - 1].plot_id', n: 'plot_id', r: true },
    // parent function
    { q: 'parent(plot_id)', n: 'plot_id', r: true },
    // global objects
    { q: 'Math.min(plot[0].plot_id, plot[1].plot_id, plot[2].plot_id)', r: true },
    { q: 'Number.isFinite(plot[1].plot_id)', r: true },
    { q: 'Number.isSomething(plot[1].plot_id)', r: false },
    { q: 'String.fromCharCode(65, 66, 67)', r: true },
    // native properties
    { q: 'gps_model.toLowerCase()', r: true },
  ]

  NodeDefExpressionUtils.testNodeDefExpressions({ surveyFn: () => survey, queries })
})
