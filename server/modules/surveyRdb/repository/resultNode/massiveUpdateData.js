import pgPromise from 'pg-promise'

import * as NodeDef from '@core/survey/nodeDef'
import { TableDataNodeDef } from '@common/model/db'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import MassiveUpdate from '@server/db/massiveUpdate'
import { NA } from '@server/modules/analysis/service/rChain/rFunctions'

const pgp = pgPromise()
const { Column } = pgp.helpers

export default class MassiveUpdateData extends MassiveUpdate {
  constructor({ survey, entityDef, analysisNodeDefs }, tx) {
    const nodeDefsByColumnName = NodeDefTable.getNodeDefsByColumnNames({
      nodeDefs: analysisNodeDefs,
      includeExtendedCols: true,
    })
    const columnNames = Object.keys(nodeDefsByColumnName)

    // Adding '?' in front of a column name means it is only for a WHERE condition (record_uuid and i_id)
    const cols = [
      `?${TableDataNodeDef.columnSet.recordUuid}`,
      `?${TableDataNodeDef.columnSet.iId}`,
      ...columnNames.map((columnName) => {
        const nodeDef = nodeDefsByColumnName[columnName]
        return new Column({
          name: columnName,
          ...(NodeDef.isInteger(nodeDef) ? { cast: 'integer' } : {}),
          ...(NodeDef.isDecimal(nodeDef) ? { cast: 'decimal' } : {}),
        })
      }),
    ]
    const tableNode = new TableDataNodeDef(survey, entityDef)

    super(
      {
        schema: tableNode.schema,
        table: tableNode.name,
        cols,
        // node internal ids are unique only inside the same record
        where: ` WHERE t.${TableDataNodeDef.columnSet.recordUuid}::uuid = v.${TableDataNodeDef.columnSet.recordUuid}::uuid
          AND t.${TableDataNodeDef.columnSet.iId}::integer = v.${TableDataNodeDef.columnSet.iId}::integer`,
      },
      tx
    )

    this.nodeDefsByColumnName = nodeDefsByColumnName
    this.columnNames = columnNames
  }

  async push(rowResult) {
    const insertValues = (this.columnNames || []).reduce(
      (values, columnName) => {
        const nodeDef = this.nodeDefsByColumnName[columnName]

        let value =
          NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef) || NodeDef.isCode(nodeDef) ? null : 'DEFAULT'

        if (rowResult[columnName] && rowResult[columnName] !== NA) {
          if (NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef)) {
            value = Number(rowResult[columnName])
          } else {
            value = rowResult[columnName]
          }
        }

        return {
          ...values,
          [columnName]: value,
        }
      },
      {
        [TableDataNodeDef.columnSet.recordUuid]: rowResult[TableDataNodeDef.columnSet.recordUuid],
        // in this table the coloumn iId is the parentInternalId of the result
        [TableDataNodeDef.columnSet.iId]: rowResult[TableDataNodeDef.columnSet.parentInternalId],
      }
    )

    return super.push(insertValues)
  }
}
