import * as ProcessingChain from '@common/analysis/processingChain'

import * as pgPromise from 'pg-promise'

import * as NodeDef from '@core/survey/nodeDef'
import { TableNode } from '@common/model/db'

import MassiveUpdate from '@server/db/massiveUpdate'
import { NA } from '@server/modules/analysis/service/rChain/rFunctions'

const pgp = pgPromise()
const { Column } = pgp.helpers

export default class MassiveUpdateNodes extends MassiveUpdate {
  constructor({ surveyId, survey, entity, chain }, tx) {
    const chainNodeDefsInEntity = ProcessingChain.getChainNodeDefsInEntity({ survey, entity })(chain)
    const columnsNames = ProcessingChain.getColumnsNamesInEntity({ survey, entity })(chain)
    const nodeDefsByColumnName = ProcessingChain.getNodeDefsByColumnNameInEntity({ survey, entity })(chain)

    // Adding '?' in front of a column name means it is only for a WHERE condition in this case the record_uuid
    const cols = [
      `?${TableNode.columnSet.recordUuid}`,
      `?${TableNode.columnSet.nodeDefUuid}`,

      new Column({ name: TableNode.columnSet.value, cast: 'jsonb' }),
    ]

    const tableResultNode = new TableNode(surveyId)

    super(
      {
        schema: tableResultNode.schema,
        table: tableResultNode.name,
        cols,
        where: ` WHERE t.${TableNode.columnSet.recordUuid}::uuid = v.${TableNode.columnSet.recordUuid}::uuid AND t.${TableNode.columnSet.nodeDefUuid}::uuid = v.${TableNode.columnSet.nodeDefUuid}::uuid `,
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

  get chainNodeDefsWithNodeDef() {
    return this.chain.chain_node_defs
  }

  get chainNodeDefsInEnity() {
    return this.chainNodeDefsInEntity
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
