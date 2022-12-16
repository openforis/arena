import * as Survey from '@core/survey/survey'
import { CollectExpressionConverter } from '@server/modules/collectImport/service/collectImport/metaImportJobs/nodeDefsImportJob/collectExpressionConverter'

import { getContextUser } from '../../integration/config/context'
import * as DataTest from '../../utils/dataTest'

let survey = {}

describe('CollectExpressionConverter Test', () => {
  beforeAll(async () => {
    const user = getContextUser()

    survey = DataTest.createTestSurvey({ user })
  }, 10000)

  // ====== value expr tests
  const queries = [
    // operators
    { q: 'cluster_id > 0', r: 'cluster_id > 0' },
    { q: 'cluster_id = 10', r: 'cluster_id == 10' },
    { q: 'cluster_id >= 1', r: 'cluster_id >= 1' },
    { q: 'cluster_id <= 100', r: 'cluster_id <= 100' },
    { q: '1 = 1 and 2 = 2', r: '1 == 1 && 2 == 2' },
    { q: '1 = 1 AND 2 = 2', r: '1 == 1 && 2 == 2' },
    { q: '1 = 1 or 2 = 2', r: '1 == 1 || 2 == 2' },
    { q: '1 = 1 OR 2 = 2', r: '1 == 1 || 2 == 2' },
    {
      q: `tree_status='L' and tree_type='T' and dbh >= 40`,
      r: `tree_status=='L' && tree_type=='T' && dbh >= 40`,
      n: 'tree_id',
    },
    // predefined variables
    { q: '$this', r: 'this' },
    { q: '$this < 10 and $this > 0', r: 'this < 10 && this > 0' },
    { q: '$this >= 1 and $this < 20', r: 'this >= 1 && this < 20' },
    // not function
    { q: 'not(cluster_accessible)', r: '!(cluster_accessible)' },
    { q: 'not($this)', r: '!(this)', n: 'cluster_accessible' },
    // parent function
    { q: 'parent()/remarks', r: 'cluster.remarks', n: 'plot_id' },
    { q: 'parent()/tree[1]', r: 'plot.tree[1]', n: 'tree_id' },
    { q: 'parent()/parent()/plot[0]/tree[1].tree_id', r: 'cluster.plot[0].tree[1].tree_id', n: 'tree_id' },
    { q: 'parent()/parent()/remarks', r: 'cluster.remarks', n: 'plot_id', e: true },
    // node property access
    { q: 'cluster_location/@x', r: 'cluster_location.x' },
    { q: 'tree_species/@scientificName', r: 'tree_species.scientificName', n: 'tree_height' },
    // boolean values
    { q: 'true()', r: 'true' },
    { q: 'false()', r: 'false' },
    { q: 'TRUE', r: 'true' },
    { q: 'FALSE', r: 'false' },
    { q: 'cluster_accessible and true()', r: 'cluster_accessible && true' },
    { q: 'false() or TRUE', r: 'false || true' },
    { q: 'cluster_accessible=true()', r: 'cluster_accessible==true' },
    { q: 'cluster_accessible\nand true()', r: 'cluster_accessible && true' },
    // object conversion
    { q: 'boolean(remarks)', r: 'Boolean(remarks)' },
    { q: 'number(gps_model)', r: 'Number(gps_model)' },
    { q: 'string(cluster_id)', r: 'String(cluster_id)' },
    // numeric functions
    { q: 'ceiling(dbh)', r: 'Math.ceil(dbh)', n: 'tree_height' },
    { q: 'floor(dbh)', r: 'Math.floor(dbh)', n: 'tree_height' },
    // custom functions
    { q: 'idm:array(1, 2, 3)', r: 'Array.of(1, 2, 3)' },
    { q: 'idm:blank(cluster_id)', r: 'isEmpty(cluster_id)' },
    { q: 'idm:not-blank(cluster_id)', r: '!isEmpty(cluster_id)' },
    { q: 'idm:currentDate()', r: 'now()' },
    { q: 'idm:currentTime()', r: 'now()' },
    { q: 'idm:index()', r: 'index(plot)', n: 'plot_id' },
    { q: 'idm:position()', r: 'index(plot) + 1', n: 'plot_id' },
    {
      q: 'idm:samplingPointCoordinate(cluster_id, plot_id)',
      r: `categoryItemProp('sampling_point_data', 'location', cluster_id, plot_id)`,
      n: 'plot_id',
    },
    {
      q: 'idm:not-blank(idm:samplingPointCoordinate(cluster_id, plot_id))',
      r: `!isEmpty(categoryItemProp('sampling_point_data', 'location', cluster_id, plot_id))`,
      n: 'plot_id',
    },
    {
      q: `idm:samplingPointData('region', cluster_id)`,
      r: `categoryItemProp('sampling_point_data', 'region', cluster_id)`,
    },
    {
      q: `idm:samplingPointData('region', cluster_id, plot_id)`,
      r: `categoryItemProp('sampling_point_data', 'region', cluster_id, plot_id)`,
      n: 'plot_id',
    },
    ...['abs', 'acos', 'asin', 'atan', 'log', 'log10', 'max', 'min', 'pow', 'random', 'sin', 'sqrt', 'tan'].map(
      (fn) => ({ q: `math:${fn}`, r: `Math.${fn}` })
    ),
    { q: 'math:PI()', r: 'Math.PI' },
  ]

  queries.forEach((query) => {
    const { q: expression, r: result, n: nodeName, e: errorExpected } = query
    it(`${expression} => ${result}`, () => {
      const nodeDefCurrent = Survey.getNodeDefByName(nodeName || 'cluster_id')(survey)
      const converted = CollectExpressionConverter.convert({ survey, nodeDefCurrent, expression })
      if (errorExpected) {
        expect(converted).toBeNull()
      } else {
        expect(converted).not.toBeNull()
        // converted expression has a new line character at the end;
        // remove it before comparing the expression with the expected one
        expect(converted.trim()).toBe(result)
      }
    })
  })
})
