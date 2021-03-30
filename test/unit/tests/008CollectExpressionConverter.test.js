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
    { q: 'cluster_id = 10', r: 'cluster_id == 10' },
    { q: '1 = 1 and 2 = 2', r: '1 == 1 && 2 == 2' },
    { q: '1 = 1 AND 2 = 2', r: '1 == 1 && 2 == 2' },
    { q: '1 = 1 or 2 = 2', r: '1 == 1 || 2 == 2' },
    { q: '1 = 1 OR 2 = 2', r: '1 == 1 || 2 == 2' },
    // boolean values
    { q: 'true()', r: 'true' },
    { q: 'false()', r: 'false' },
    { q: 'TRUE', r: 'true' },
    { q: 'FALSE', r: 'false' },
    { q: 'false() or TRUE', r: 'false || true' },
    // custom functions
    { q: 'idm:array(1, 2, 3)', r: 'Array.of(1, 2, 3)' },
    { q: 'idm:blank(cluster_id)', r: 'isEmpty(cluster_id)' },
    { q: 'idm:not-blank(cluster_id)', r: '!isEmpty(cluster_id)' },
    { q: 'idm:currentDate()', r: 'now()' },
    { q: 'idm:currentTime()', r: 'now()' },
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
      q: `idm:samplingPointData('region', cluster_id, plot_id)`,
      r: `categoryItemProp('sampling_point_data', 'region', cluster_id, plot_id)`,
      n: 'plot_id',
    },
    ...[
      'abs',
      'acos',
      'asin',
      'atan',
      'log',
      'log10',
      'max',
      'min',
      'pow',
      'random',
      'sin',
      'sqrt',
      'tan',
    ].map((fn) => ({ q: `math:${fn}`, r: `Math.${fn}` })),
    { q: 'math:PI()', r: 'Math.PI' },
    // predefined variables
    { q: '$this', r: 'cluster_id' },
    { q: '$this < 10 and $this > 0', r: 'cluster_id < 10 && cluster_id > 0' },
  ]

  queries.forEach((query) => {
    const { q: expression, r: result, n: nodeName } = query
    it(`${expression} => ${result}`, () => {
      const nodeDefCurrent = Survey.getNodeDefByName(nodeName || 'cluster_id')(survey)
      const converted = CollectExpressionConverter.convert({ survey, nodeDefCurrent, expression })
      expect(converted).toBe(result)
    })
  })
})
