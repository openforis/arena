import * as pgPromise from 'pg-promise'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { TableNode } from '@common/model/db'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'

import MassiveUpdate from '@server/db/massiveUpdate'
import { NA } from '@server/modules/analysis/service/rChain/rFunctions'

const pgp = pgPromise()
const { Column } = pgp.helpers

export default class MassiveUpdateNodes extends MassiveUpdate {
  constructor({ surveyId, survey, entity, chain }, tx) {
    const analysisNodeDefsInEntity = Survey.getNodeDefDescendantAttributesInSingleEntities(entity)(survey).filter(
      NodeDef.isAnalysis
    )
    const nodeDefsByColumnName = NodeDefTable.getNodeDefsByColumnNames(analysisNodeDefsInEntity)

    // Adding '?' in front of a column name means it is only for a WHERE condition in this case the record_uuid
    const cols = [
      `?${TableNode.columnSet.recordUuid}`,
      `?${TableNode.columnSet.nodeDefUuid}`,

      new Column({ name: TableNode.columnSet.value, cast: 'jsonb' }),
    ]

    const tableNode = new TableNode(surveyId)

    super(
      {
        schema: tableNode.schema,
        table: tableNode.name,
        cols,
        where: ` WHERE t.${TableNode.columnSet.recordUuid}::uuid = v.${TableNode.columnSet.recordUuid}::uuid AND t.${TableNode.columnSet.nodeDefUuid}::uuid = v.${TableNode.columnSet.nodeDefUuid}::uuid `,
      },
      tx
    )

    this.survey = survey
    this.entity = entity
    this.chain = chain

    this.nodeDefsByColumnName = nodeDefsByColumnName
  }

  async push(rowResult) {
    const insertValues = Object.keys(this.nodeDefsByColumnName).reduce(
      (values, columnName) => {
        let value = 'DEFAULT'

        const nodeDef = this.nodeDefsByColumnName[columnName]
        if (rowResult[columnName] && rowResult[columnName] !== NA) {
          value = rowResult[columnName]
          if (NodeDef.isCode(nodeDef)) {
            value = { itemUuid: rowResult[columnName.replace('_code', '_uuid').replace('_label', '_uuid')] }
          }
        }

        if (NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef)) {
          value = String(isNaN(Number(rowResult[columnName])) ? null : Number(rowResult[columnName]))
        }

        return {
          ...values,
          [TableNode.columnSet.nodeDefUuid]: NodeDef.getUuid(nodeDef),
          [TableNode.columnSet.value]: value,
        }
      },
      {
        [TableNode.columnSet.recordUuid]: rowResult[TableNode.columnSet.recordUuid],
      }
    )

    return super.push(insertValues)
  }
}
