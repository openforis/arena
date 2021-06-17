import * as Chain from '@common/analysis/chain'

import * as NodeDef from '@core/survey/nodeDef'
import { TableDataNodeDef } from '@common/model/db'

import MassiveUpdate from '@server/db/massiveUpdate'
import { NA } from '@server/modules/analysis/service/rChain/rFunctions'

export default class MassiveUpdateData extends MassiveUpdate {
  constructor({ survey, entity, chain, cycle }, tx) {
    const chainNodeDefsInEntity = Chain.getChainNodeDefsInEntity({ entity })(chain)
    const columnsNames = Chain.getColumnsNamesInEntity({ entity })(chain)
    const nodeDefsByColumnName = Chain.getNodeDefsByColumnNameInEntity({ entity })(chain)

    // Adding '?' in front of a column name means it is only for a WHERE condition in this case the record_uuid
    const cols = [`?${TableDataNodeDef.columnSet.recordUuid}`, ...(columnsNames || [])]
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
    this.chainNodeDefsInEntity = chainNodeDefsInEntity
    this.nodeDefsByColumnName = nodeDefsByColumnName
    this.columnsNames = columnsNames
  }

  get chainNodeDefsInEnity() {
    return this.chainNodeDefsInEntity
  }

  async push(rowResult) {
    const insertValues = (this.columnsNames || []).reduce(
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
