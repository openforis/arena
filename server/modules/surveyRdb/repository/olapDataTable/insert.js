import { Schemata } from '@common/model/db'
import TableOlapData from '@common/model/db/tables/olapData/table'

import * as Survey from '@core/survey/survey'

import { db } from '@server/db/db'
import * as DbUtils from '@server/db/dbUtils'

export const insertOlapData = async ({ survey, cycle, chain, entityDef, values }, client = db) => {
  const surveyId = Survey.getId(survey)
  const baseUnitDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const table = new TableOlapData({ survey, cycle, entityDef, baseUnitDef })
  await client.none(
    DbUtils.insertAllQueryBatch(Schemata.getSchemaSurveyRdb(surveyId), table.name, table.columnNamesForInsert, values)
  )
}
