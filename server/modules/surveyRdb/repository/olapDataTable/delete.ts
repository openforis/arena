import type { ArenaChain, ArenaSurvey, ArenaNodeDefEntity } from '@openforis/arena-core'
import TableOlapData from '@common/model/db/tables/olapData/table'
import * as Survey from '@core/survey/survey'

import { db, DbClient } from '@server/db/db'

export const clearOlapData = (
  {
    survey,
    cycle,
    chain,
    entityDef,
  }: { survey: ArenaSurvey; cycle: string; chain: ArenaChain; entityDef: ArenaNodeDefEntity },
  client: DbClient = db
) => {
  const baseUnitDef = Survey.getBaseUnitNodeDef({ chain })(survey)
  const table = new TableOlapData({ survey, cycle, baseUnitDef, entityDef })
  return client.query(`DELETE FROM ${table.nameQualified}`)
}
