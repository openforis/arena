import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { Query } from '@common/model/query'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbService from '@server/modules/surveyRdb/service/surveyRdbService'

import { getContextUser } from '../config/context'

import * as RB from '../../utils/recordBuilder'
import * as SB from '../../utils/surveyBuilder'

const { nodeDefType } = NodeDef
const cycle = Survey.cycleOneKey

const aggregateFunctions = {
  fn1: { uuid: 'fn1', name: 'alive_total', expression: "sum(dbh) filter (where tree_status = 'alive')" },
  fn2: { uuid: 'fn2', name: 'dead_count', expression: "count(*) filter (where tree_status = 'it''s dead')" },
  fn3: { uuid: 'fn3', name: 'avg_rounded', expression: 'round(avg(dbh)::numeric, 1)' },
  // stored without validation (e.g. imported): never run
  fn4: { uuid: 'fn4', name: 'not_valid', expression: 'sum(dbh)); select 1; --' },
}

const treeBuilder = (treeId: number, dbh: number, status: string) =>
  RB.entity('tree', RB.attribute('tree_id', treeId), RB.attribute('dbh', dbh), RB.attribute('tree_status', status))

describe('Data Explorer custom aggregate functions', () => {
  let survey: any = null

  const getDefUuid = (name: string) => NodeDef.getUuid(Survey.getNodeDefByName(name)(survey))

  const fetchAggregateData = (aggregateFunctionUuids: string[]) => {
    const query = Query.assocMeasures({ [getDefUuid('dbh')]: aggregateFunctionUuids })(
      Query.assocMode(Query.modes.aggregate)(Query.create({ entityDefUuid: getDefUuid('tree') }))
    )
    const user = getContextUser()
    return SurveyRdbService.fetchViewData({ user, surveyId: Survey.getId(survey), cycle, query } as any)
  }

  beforeAll(async () => {
    const user = getContextUser()

    survey = await SB.survey(
      user,
      SB.entity(
        'cluster',
        SB.attribute('cluster_id').key(),
        SB.entity(
          'tree',
          SB.attribute('tree_id', nodeDefType.integer).key(),
          SB.attribute('dbh', nodeDefType.decimal).propAdvanced(
            NodeDef.keysPropsAdvanced.aggregateFunctions,
            aggregateFunctions
          ),
          SB.attribute('tree_status')
        ).multiple()
      )
    ).buildAndStore()

    await RB.record(
      user,
      survey,
      RB.entity(
        'cluster',
        RB.attribute('cluster_id', 'C1'),
        treeBuilder(1, 10, 'alive'),
        treeBuilder(2, 20, 'alive'),
        treeBuilder(3, 5, "it's dead")
      )
    ).buildAndStore()
  })

  afterAll(async () => {
    if (survey) {
      await SurveyManager.deleteSurvey(Survey.getId(survey))
    }
  })

  test('valid expressions are run', async () => {
    const rows: any[] = await fetchAggregateData(['fn1', 'fn2', 'fn3'])
    expect(rows.length).toBe(1)
    const [row] = rows
    expect(Number(row.dbh_custom_agg_alive_total)).toBe(30)
    expect(Number(row.dbh_custom_agg_dead_count)).toBe(1)
    expect(Number(row.dbh_custom_agg_avg_rounded)).toBe(11.7)
  })

  test('expressions with not allowed SQL are never run', async () => {
    await expect(fetchAggregateData(['fn1', 'fn4'])).rejects.toThrow()
  })

  test('read-only transactions cannot modify data', async () => {
    await expect(
      db.tx(DbUtils.txOptionsReadOnly, (t) => t.none('CREATE TEMPORARY TABLE read_only_tx_test (id integer)'))
    ).rejects.toThrow(/read-only transaction/)
  })
})
