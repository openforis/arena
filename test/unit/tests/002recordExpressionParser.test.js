import { SystemError } from '@openforis/arena-core'

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
    { q: 'Math.pow(cluster_id, 3)', r: 1728 },
    // 18 * 0.5 >= 1728
    { q: '(cluster_distance * 0.5) >= Math.pow(cluster_id, 3)', r: false },
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
    // categoryItemProp
    { q: `categoryItemProp('hierarchical_category', 'prop1', '1')`, r: 'Extra prop1 item 1' },
    { q: `categoryItemProp('hierarchical_category', 'prop2', '3')`, r: 'Extra prop2 item 3' },
    { q: `categoryItemProp('hierarchical_category', 'prop1', '2', '1')`, r: 'Extra prop1 item 2-1' },
    { q: `categoryItemProp('hierarchical_category', 'prop1', cluster_id - 10)`, r: 'Extra prop1 item 2' },
    {
      q: `categoryItemProp('hierarchical_category', 'prop1', cluster_id - 10, plot_id)`,
      r: 'Extra prop1 item 2-2',
      n: 'cluster/plot[1]/plot_id',
    },
    // categoryItemProp: unexisting prop or code
    {
      q: `categoryItemProp('hierarchical_category', 'prop9', '1')`,
      r: null,
    },
    {
      q: `categoryItemProp('hierarchical_category', 'prop1', '999')`,
      r: null,
    },
    // distance
    // distance between 2 points as text
    {
      q: `distance('SRID=EPSG:4326;POINT(50.84809 5.69769)', 'SRID=EPSG:4326;POINT(50.84805423 5.697799)').toFixed(2)`,
      r: '12.75', // real distance should be around 8.57m
    },
    // distance between 2 points as coordinate attributes
    { q: 'distance(plot[0].plot_location, plot[1].plot_location).toFixed(2)', r: '2171.94' },
    // distance: commutative property
    {
      q: 'distance(plot[0].plot_location, plot[1].plot_location) == distance(plot[1].plot_location, plot[0].plot_location)',
      r: true,
    },
    // distance between points in the same location should be 0
    { q: `distance('SRID=EPSG:4326;POINT(12.89463 42.00048)', 'SRID=EPSG:4326;POINT(12.89463 42.00048)')`, r: 0 },
    // distance (invalid node type)
    { q: 'distance(plot[0].plot_location, remarks)', r: null },
    // distance (using categoryItemProp)
    {
      q: `distance(cluster_location, categoryItemProp('sampling_point', 'location', cluster_id)).toFixed(2)`,
      r: '4307919.62',
    },
    {
      q: `distance(plot_location, categoryItemProp('sampling_point', 'location', cluster_id, plot_id)).toFixed(2)`,
      r: '4311422.21',
      n: 'cluster/plot[1]/plot_id',
    },
    // taxonProp
    { q: `taxonProp('trees', 'max_height', 'AFZ/QUA')`, r: '200' },
    { q: `taxonProp('trees', 'max_dbh', 'OLE/CAP')`, r: '40' },
    // taxonProp: unexisting prop or code
    { q: `taxonProp('trees', 'unexisting_prop', 'AFZ/QUA')`, r: null },
    { q: `taxonProp('trees', 'max_dbh', 'AFZ/QUA/OTHER')`, r: null },
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
    { q: 'Invalid.func(1)', e: new SystemError('expression.identifierNotFound') },
    { q: 'Math.unknownFunc(1)', e: new SystemError('expression.identifierNotFound') },
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
    { q: 'cluster_location.srs', r: '4326' },
    { q: 'plot[0].tree[0].tree_species.code', r: 'ACA' },
    { q: 'plot[0].tree[0].tree_species.scientificName', r: 'Acacia sp.' },
    { q: 'visit_date.year', r: 2021 },
    { q: 'visit_date.month', r: 1 },
    { q: 'visit_date.day', r: 1 },
    { q: 'visit_date.week', e: new SystemError('expression.invalidAttributeValuePropertyName') },
    { q: 'visit_time.hour', r: 10 },
    { q: 'visit_time.minute', r: 30 },
    { q: 'visit_time.seconds', e: new SystemError('expression.invalidAttributeValuePropertyName') },
    // this
    { q: 'this', n: 'cluster/cluster_id', r: 12 },
    {
      q: `distance(this, 'SRID=EPSG:4326;POINT(50.84805423 5.697799)').toFixed(2)`,
      n: 'cluster/plot[1]/plot_location',
      r: '1240078.57',
    },
  ]

  NodeDefExpressionUtils.testRecordExpressions({ surveyFn: () => survey, recordFn: () => record, queries })
})
