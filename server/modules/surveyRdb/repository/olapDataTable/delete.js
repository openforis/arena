import TableOlapData from '@common/model/db/tables/olapData/table'
import * as Survey from '@core/survey/survey'

import { db } from '@server/db/db'

export const clearOlapData = async ({ survey, cycle, chain, entityDef }, client = db) => {
  const baseUnitDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const table = new TableOlapData({ survey, cycle, baseUnitDef, entityDef })
  return client.query(`DELETE FROM ${table.nameQualified}`)
}
