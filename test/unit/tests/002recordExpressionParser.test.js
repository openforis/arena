import * as Validation from '@core/validation/validation'
import SystemError from '@core/systemError'

import * as RecordUtils from '../../utils/recordUtils'
import * as DataTest from '../../utils/dataTest'
import * as NodeDefExpressionUtils from '../../utils/nodeDefExpressionUtils'

import { getContextUser } from '../../integration/config/context'

let survey = {}
let record = {}

const getNode = (path) => RecordUtils.findNodeByPath(path)(survey, record)

describe('RecordExpressionParser Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = DataTest.createTestSurvey({ user })

    record = DataTest.createTestRecord({ user, survey })
  }, 10000)

  // ====== value expr tests
  const queries = [
    { q: 'cluster_id + 1', r: 13 },
    { q: 'cluster_id != 1', r: true },
    // !12 == null under strict logical negation semantics
    { q: '!cluster_id', r: null },
    // Number + String is invalid -> null
    { q: 'cluster_id + "1"', r: null },
    { q: '!(cluster_id == 1)', r: true },
    // 18 + 1
    { q: 'cluster_distance + 1', r: 19 },
    // 18 + 1
    { q: 'cluster_distance + 1', r: 19 },
    // 18 + 1 + 12
    { q: 'cluster_distance + 1 + cluster_id', r: 31 },
    // 18 + 12
    { q: 'cluster_distance + cluster_id', r: 30 },
    // 19 >= 12
    { q: 'cluster_distance + 1 >= cluster_id', r: true },
    // 18 * 0.5 >= 12
    { q: '(cluster_distance * 0.5) >= cluster_id', r: false },
    // 1728
    { q: 'pow(cluster_id, 3)', r: 1728 },
    // 18 * 0.5 >= 1728
    { q: '(cluster_distance * 0.5) >= pow(cluster_id, 3)', r: false },
    // visit_date must be before current date
    { q: 'visit_date <= now()', r: true },
    // cluster_id is not empty
    { q: 'isEmpty(cluster_id)', r: false },
    // gps_model is not empty
    { q: 'isEmpty(gps_model)', r: false },
    // remarks is empty
    { q: 'isEmpty(remarks)', r: true },
    // plot count is 3
    { q: 'plot.length', r: 3 },
    // access multiple entities with index
    { q: 'plot[0].plot_id', r: 1 },
    { q: 'plot[1].plot_id', r: 2 },
    { q: 'plot[2].plot_id', r: 3 },
    { q: 'plot[4].plot_id', r: null },
    // plot_multiple_number counts
    { q: 'plot[0].plot_multiple_number.length', r: 2 },
    { q: 'plot[1].plot_multiple_number.length', r: 0 },
    { q: 'plot[2].plot_multiple_number.length', r: 1 },
    // index (single entity)
    { q: 'index(cluster)', r: 0 },
    { q: 'index(cluster)', r: 0, n: 'cluster/plot[0]/plot_id' },
    // index (multiple entity)
    { q: 'index(plot)', r: 0, n: 'cluster/plot[0]' },
    { q: 'index(plot)', r: 1, n: 'cluster/plot[1]' },
    { q: 'index(plot)', r: 0, n: 'cluster/plot[0]/plot_id' },
    { q: 'index(plot)', r: 1, n: 'cluster/plot[1]/plot_id' },
    { q: 'index(plot[0])', r: 0 },
    { q: 'index(plot[1])', r: 1 },
    { q: 'index(plot[2])', r: 2 },
    { q: 'index(plot[3])', r: -1 },
    // index (single attribute)
    { q: 'index(visit_date)', r: 0, n: 'cluster/remarks' },
    { q: 'index(plot[0].plot_id)', r: 0 },
    { q: 'index(plot_id)', r: 0, n: 'cluster/plot[0]/plot_multiple_number[1]' },
    // index (multiple attribute)
    { q: 'index(plot[0].plot_multiple_number[0])', r: 0 },
    { q: 'index(plot[0].plot_multiple_number[1])', r: 1 },
    { q: 'index(plot[0].plot_multiple_number[2])', r: -1 },
    { q: 'index(plot_multiple_number)', r: 0, n: 'cluster/plot[0]/plot_multiple_number[0]' },
    { q: 'index(plot_multiple_number)', r: 1, n: 'cluster/plot[0]/plot_multiple_number[1]' },
    // parent
    { q: 'parent(cluster)', r: null },
    { q: 'parent(remarks)', r: () => getNode('cluster') },
    { q: 'parent(plot_id)', r: () => getNode('cluster/plot[1]'), n: 'cluster/plot[1]/plot_id' },
    { q: 'parent(parent(plot_id))', r: () => getNode('cluster'), n: 'cluster/plot[1]/plot_id' },
    { q: 'index(parent(plot_id))', r: 1, n: 'cluster/plot[1]/plot_id' },
    // access plot_id of previous plot
    { q: 'parent(parent(plot_id)).plot[index(parent(plot_id)) - 1].plot_id', r: 1, n: 'cluster/plot[1]/plot_id' },
    // access dbh of a tree inside sibling plot
    {
      q: 'parent(parent(parent(dbh))).plot[index(parent(parent(dbh))) - 2].tree[1].dbh',
      r: 10.123,
      n: 'cluster/plot[2]/tree[1]/dbh',
    },
    // global objects (Array)
    { q: 'Array.of(plot[0].plot_id, plot[1].plot_id, plot[2].plot_id)', r: [1, 2, 3] },
    // global objects (Date)
    { q: `Date.parse('01 Jan 1970 00:00:00 GMT')`, r: 0 },
    { q: 'Math.round(Date.now() / 1000)', r: () => Math.round(Date.now() / 1000) },
    // global objects (Math)
    { q: 'Math.PI', r: Math.PI },
    { q: 'Math.min(plot[0].plot_id, plot[1].plot_id, plot[2].plot_id)', r: 1 },
    { q: 'Math.max(plot[0].plot_id, plot[1].plot_id, plot[2].plot_id)', r: 3 },
    // global objects (Number)
    { q: 'Number.isFinite(plot[1].plot_id)', r: true },
    { q: 'Number.isFinite(plot[1].plot_id / 0)', r: false },
    // global objects (String)
    { q: 'String.fromCharCode(65, 66, 67)', r: 'ABC' },
    // global objects (unknown objects/functions)
    { q: 'Invalid.func(1)', e: new SystemError(Validation.messageKeys.expressions.unableToFindNode) },
    { q: 'Math.unknownFunc(1)', e: new SystemError('undefinedFunction') },
    // native properties (number)
    { q: 'Math.PI.toFixed(2)', r: '3.14' },
    { q: 'plot[0].tree[1].dbh.toFixed(1)', r: '10.1' },
    { q: 'plot[0].tree[1].dbh.toPrecision(4)', r: '10.12' },
    // native properties (string)
    { q: 'gps_model.toLowerCase()', r: 'abc-123-xyz' },
    { q: 'gps_model.substring(4,7)', r: '123' },
    { q: 'gps_model.length', r: 11 },
    // global objects (constructors)
    { q: 'Boolean(cluster_id)', r: true },
    { q: 'Boolean(remarks)', r: false },
    { q: 'Date.parse(Date()) <= Date.now()', r: true },
    { q: 'Number(remarks)', r: 0 },
    { q: 'String(cluster_id)', r: '12' },
    // composite attribute members
    { q: 'cluster_location.x', r: 41.883012 },
    { q: 'cluster_location.y', r: 12.489056 },
    { q: 'cluster_location.srs', r: 'EPSG:4326' },
    { q: 'plot[0].tree[0].tree_species.code', r: 'ACA' },
    { q: 'plot[0].tree[0].tree_species.scientificName', r: 'Acacia sp.' },
    { q: 'visit_date.year', r: 2021 },
    { q: 'visit_date.month', r: 1 },
    { q: 'visit_date.day', r: 1 },
    { q: 'visit_date.week', e: new SystemError(Validation.messageKeys.expressions.unableToFindNode) },
    { q: 'visit_time.hour', r: 10 },
    { q: 'visit_time.minute', r: 30 },
    { q: 'visit_time.seconds', e: new SystemError(Validation.messageKeys.expressions.unableToFindNode) },
  ]

  NodeDefExpressionUtils.testRecordExpressions({ surveyFn: () => survey, recordFn: () => record, queries })
})
