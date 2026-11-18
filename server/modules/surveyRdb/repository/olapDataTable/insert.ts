import type { Chain as ArenaChain, Survey as ArenaSurvey } from '@openforis/arena-core'
import { Schemata } from '@common/model/db'
import TableOlapData from '@common/model/db/tables/olapData/table'

import * as Survey from '@core/survey/survey'

import { db, DbClient } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

export const insertOlapData = async (
  {
    survey,
    cycle,
    chain,
    entityDef,
    values,
  }: { survey: ArenaSurvey; cycle: string; chain: ArenaChain; entityDef: any; values: any },
  client: DbClient = db
) => {
  const surveyId = Survey.getId(survey)
  const baseUnitDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const table = new TableOlapData({ survey, cycle, entityDef, baseUnitDef })
  const colNames = table.columnNamesForInsert
  await client.none(
    DbUtils.insertAllQueryBatch(Schemata.getSchemaSurveyRdb(surveyId), table.name, colNames, values, true)
  )
}
