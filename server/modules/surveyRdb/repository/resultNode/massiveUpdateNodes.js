import * as pgPromise from 'pg-promise'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { TableNode } from '@common/model/db'

import MassiveUpdate from '@server/db/massiveUpdate'
import { NA } from '@server/modules/analysis/service/rChain/rFunctions'

const pgp = pgPromise()
const { Column } = pgp.helpers

export default class MassiveUpdateNodes extends MassiveUpdate {
  constructor({ surveyId, survey, entity, chain }, tx) {
    const analysisNodeDefsInEntity = Survey.getAnalysisNodeDefs({ entity, chain })(survey)
    const nodeDefsByColumnName = NodeDef.getNodeDefsByColumnNames(analysisNodeDefsInEntity)

    // Adding '?' in front of a column name means it is only for a WHERE condition in this case the record_uuid
    const cols = [
      `?${TableNode.columnSet.recordUuid}`,
      `?${TableNode.columnSet.nodeDefUuid}`,

      new Column({ name: TableNode.columnSet.value, cast: 'jsonb' }),
    ]

    const tabletNode = new TableNode(surveyId)

    super(
      {
        schema: tabletNode.schema,
        table: tabletNode.name,
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
      (values, cloumnName) => {
        let value = 'DEFAULT'
        const nodeDef = this.nodeDefsByColumnName[cloumnName]
        if (rowResult[cloumnName] && rowResult[cloumnName] !== NA) {
          value = rowResult[cloumnName]
          if (NodeDef.isCode(nodeDef)) {
            value = { itemUuid: rowResult[cloumnName.replace('_code', '_uuid').replace('_label', '_uuid')] }
          }
        }

        return {
          ...values,
          [TableNode.columnSet.nodeDefUuid]: NodeDef.getUuid(nodeDef),
          [TableNode.columnSet.value]: JSON.stringify(value),
        }
      },
      {
        [TableNode.columnSet.recordUuid]: rowResult[TableNode.columnSet.recordUuid],
      }
    )

    return super.push(insertValues)
  }
}
