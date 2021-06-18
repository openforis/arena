import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { TableDataNodeDef } from '@common/model/db'

import MassiveUpdate from '@server/db/massiveUpdate'
import { NA } from '@server/modules/analysis/service/rChain/rFunctions'

export default class MassiveUpdateData extends MassiveUpdate {
  constructor({ survey, entity, chain, cycle }, tx) {
    const analysisNodeDefsInEntity = Survey.getAnalysisNodeDefs({ entity, chain })(survey)
    const nodeDefsByColumnName = NodeDef.getNodeDefsByColumnNames(analysisNodeDefsInEntity)
    const columnNames = Object.keys(nodeDefsByColumnName)

    // Adding '?' in front of a column name means it is only for a WHERE condition in this case the record_uuid
    const cols = [`?${TableDataNodeDef.columnSet.recordUuid}`, ...columnNames]
    const tabletNode = new TableDataNodeDef(survey, entity)

    super(
      {
        schema: tabletNode.schema,
        table: tabletNode.name,
        cols,
        where: ` WHERE t.record_uuid::uuid = v.record_uuid::uuid AND t.record_cycle = '${cycle}' `,
      },
      tx
    )

    this.survey = survey
    this.entity = entity
    this.chain = chain
    this.nodeDefsByColumnName = nodeDefsByColumnName
    this.columnNames = columnNames
  }

  async push(rowResult) {
    const insertValues = (this.columnNames || []).reduce(
      (values, cloumnName) => {
        let value = 'DEFAULT'
        if (rowResult[cloumnName] && rowResult[cloumnName] !== NA) {
          const nodeDef = this.nodeDefsByColumnName[cloumnName]
          if (NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef)) {
            value = Number(rowResult[cloumnName])
          } else {
            value = rowResult[cloumnName]
          }
        }

        return {
          ...values,
          [cloumnName]: value,
        }
      },
      {
        [TableDataNodeDef.columnSet.recordUuid]: rowResult[TableDataNodeDef.columnSet.recordUuid],
      }
    )

    return super.push(insertValues)
  }
}
