import type { DbClient } from '@server/db/db'
import type { Survey as ArenaSurvey } from '@openforis/arena-core'
import { DB } from '@openforis/arena-server'

import { TableDataNodeDef } from '@common/model/db'

import * as Survey from '@core/survey/survey'

export const deleteRowsByRecordUuid = (
  { survey, recordUuid }: { survey: ArenaSurvey; recordUuid: string },
  client: DbClient = DB
) => {
  const rootDef = Survey.getNodeDefRoot(survey)
  const rootTable = new TableDataNodeDef(survey, rootDef)

  return client.any(
    `DELETE FROM ${rootTable.nameAliased}
    WHERE ${rootTable.columnRecordUuid} = $1`,
    [recordUuid]
  )
}
