import { DB } from '@openforis/arena-server'

import { TableDataNodeDef } from '@common/model/db'

import * as Survey from '@core/survey/survey'

export const deleteRowsByRecordUuid = async ({ survey, recordUuid }, client = DB) => {
  const rootDef = Survey.getNodeDefRoot(survey)
  const rootTable = new TableDataNodeDef(survey, rootDef)

  return client.any(
    `DELETE FROM ${rootTable.nameAliased}
    WHERE ${rootTable.columnRecordUuid} = $1`,
    [recordUuid]
  )
}
