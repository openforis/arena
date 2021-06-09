import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { TableResultNode } from '@common/model/db'

import MassiveInsert from '@server/db/massiveInsert'
import { NA } from '@server/modules/analysis/service/rChain/rFunctions'

export default class MassiveInsertResultNodes extends MassiveInsert {
  constructor(survey, entity, chain, tx) {
    const cols = [
      TableResultNode.columnSet.recordUuid,
      TableResultNode.columnSet.parentUuid,
      TableResultNode.columnSet.chainUuid,
      TableResultNode.columnSet.nodeDefUuid,
      TableResultNode.columnSet.value,
    ]
    const tableResultNode = new TableResultNode(Survey.getId(survey))
    super(tableResultNode.schema, tableResultNode.name, cols, tx)

    this.survey = survey
    this.entity = entity
    this.chain = chain
  }

  get chainNodeDefsWithNodeDef() {
    return this.chain.chain_node_defs
  }

  async push(rowResult) {
    const insertValues = []

    const chainNodeDefsInEntity = (this.chainNodeDefsWithNodeDef || []).filter(
      (chainNodeDef) => chainNodeDef.chain_uuid === this.chain.uuid
    )

    chainNodeDefsInEntity.forEach((chainNodeDef) => {
      const nodeDef = Survey.getNodeDefByUuid(chainNodeDef.node_def_uuid)(this.survey)
      const nodeDefName = NodeDef.getName(nodeDef)

      const nodeDefUuid = NodeDef.getUuid(nodeDef)

      let value = rowResult[nodeDefName]
      if (value === NA) value = null

      const insertValue = {
        [TableResultNode.columnSet.recordUuid]: rowResult[TableResultNode.columnSet.recordUuid],
        [TableResultNode.columnSet.parentUuid]: rowResult[TableResultNode.columnSet.parentUuid],
        [TableResultNode.columnSet.chainUuid]: rowResult[TableResultNode.columnSet.chainUuid],
        [TableResultNode.columnSet.nodeDefUuid]: nodeDefUuid,
        [TableResultNode.columnSet.value]: value,
      }
      
      insertValues.push(insertValue)
    })

    return super.push(...insertValues)
  }
}
