import * as pgPromise from 'pg-promise'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
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
  constructor({ surveyId, survey, entity, chain }, tx) {
    const analysisNodeDefsInEntity = Survey.getNodeDefDescendantAttributesInSingleEntities(
      entity,
      true
    )(survey).filter(NodeDef.isAnalysis)
    const nodeDefsByColumnName = NodeDefTable.getNodeDefsByColumnNames({
      nodeDefs: analysisNodeDefsInEntity,
      includeExtendedCols: true,
    })

    // Adding '?' in front of a column name means it is only for a WHERE condition in this case the record_uuid
    const cols = [
      `?${TableNode.columnSet.recordUuid}`,
      `?${TableNode.columnSet.nodeDefUuid}`,
      `?${TableNode.columnSet.parentUuid}`,

      new Column({ name: TableNode.columnSet.value, cast: 'jsonb' }),
    ]

    const tableNode = new TableNode(surveyId)

    super(
      {
        schema: tableNode.schema,
        table: tableNode.name,
        cols,
        where: ` WHERE 
        t.${TableNode.columnSet.recordUuid}::uuid = v.${TableNode.columnSet.recordUuid}::uuid 
        AND t.${TableNode.columnSet.nodeDefUuid}::uuid = v.${TableNode.columnSet.nodeDefUuid}::uuid
        AND t.${TableNode.columnSet.parentUuid}::uuid = v.${TableNode.columnSet.parentUuid}::uuid `,
      },
      tx
    )

    this.survey = survey
    this.entity = entity
    this.chain = chain

    this.nodeDefsByColumnName = nodeDefsByColumnName
  }

  async push(rowResult) {
    Object.keys(this.nodeDefsByColumnName).forEach((columnName) => {
      const nodeDef = this.nodeDefsByColumnName[columnName]

      const value = extractValueFromRowResult({ rowResult, nodeDef, columnName })

      const values = {
        [TableNode.columnSet.parentUuid]: rowResult[TableNode.columnSet.parentUuid],
        [TableNode.columnSet.recordUuid]: rowResult[TableNode.columnSet.recordUuid],
        [TableNode.columnSet.nodeDefUuid]: NodeDef.getUuid(nodeDef),
        [TableNode.columnSet.value]: value,
      }

      super.push(values)
    })

    return true
  }
}
