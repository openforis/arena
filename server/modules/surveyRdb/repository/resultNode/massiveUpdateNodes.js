import * as pgPromise from 'pg-promise'

import * as NodeDef from '@core/survey/nodeDef'
import { TableNode } from '@common/model/db'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import MassiveUpdate from '@server/db/massiveUpdate'
import { NA } from '@server/modules/analysis/service/rChain/rFunctions'

const pgp = pgPromise()
const { Column } = pgp.helpers

const extractValueFromRowResult = ({ rowResult, nodeDef, columnName }) => {
  const cellValue = rowResult[columnName]

  if (cellValue && cellValue !== NA) {
    if (NodeDef.isCode(nodeDef)) {
      const categoryItemUuidColumnName = `${NodeDef.getName(nodeDef)}_uuid`
      const itemUuid = rowResult[categoryItemUuidColumnName]
      return itemUuid ? { itemUuid } : null
    }
    if (NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef)) {
      return String(Number(cellValue))
    }
    return cellValue
  }
  return NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef) || NodeDef.isCode(nodeDef) ? null : 'DEFAULT'
}

export default class MassiveUpdateNodes extends MassiveUpdate {
  constructor({ survey, analysisNodeDefs }, tx) {
    const nodeDefsByColumnName = NodeDefTable.getNodeDefsByColumnNames({
      nodeDefs: analysisNodeDefs,
      includeExtendedCols: true,
    })

    const colSet = TableNode.columnSet

    // Adding '?' in front of a column name means it is only for a WHERE condition in this case the record_uuid
    const cols = [
      `?${colSet.recordUuid}`,
      `?${colSet.nodeDefUuid}`,
      `?${colSet.parentIId}`,
      new Column({ name: colSet.value, cast: 'jsonb' }),
    ]

    const tableNode = new TableNode(survey)

    super(
      {
        schema: tableNode.schema,
        table: tableNode.name,
        cols,
        where: ` WHERE 
        t.${colSet.recordUuid}::uuid = v.${colSet.recordUuid}::uuid 
        AND t.${colSet.nodeDefUuid}::uuid = v.${colSet.nodeDefUuid}::uuid
        AND t.${colSet.parentIId} = v.${colSet.parentIId} `,
      },
      tx
    )

    this.nodeDefsByColumnName = nodeDefsByColumnName
  }

  async push(rowResult) {
    Object.keys(this.nodeDefsByColumnName).forEach((columnName) => {
      const nodeDef = this.nodeDefsByColumnName[columnName]

      const value = extractValueFromRowResult({ rowResult, nodeDef, columnName })

      const values = {
        [colSet.parentIId]: rowResult[colSet.parentIId],
        [colSet.recordUuid]: rowResult[colSet.recordUuid],
        [colSet.nodeDefUuid]: NodeDef.getUuid(nodeDef),
        [colSet.value]: value,
      }

      super.push(values)
    })

    return true
  }
}
