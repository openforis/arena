import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import { TableResultNode } from '@common/model/db'

import MassiveInsert from '@server/db/massiveInsert'

export default class MassiveInsertResultNodes extends MassiveInsert {
  constructor(survey, step, tx) {
    const cols = [
      TableResultNode.columnSet.chainUuid,
      TableResultNode.columnSet.stepUuid,
      TableResultNode.columnSet.recordUuid,
      TableResultNode.columnSet.parentUuid,
      TableResultNode.columnSet.nodeDefUuid,
      TableResultNode.columnSet.value,
    ]
    const tableResultNode = new TableResultNode(Survey.getId(survey))
    super(tableResultNode.schema, tableResultNode.name, cols, tx)

    this.survey = survey
    this.calculations = ProcessingStep.getCalculations(step)
  }

  async push(rowResult) {
    const insertValues = []
    this.calculations.forEach((calculation) => {
      const nodeDef = Survey.getNodeDefByUuid(ProcessingStepCalculation.getNodeDefUuid(calculation))(this.survey)
      const nodeDefName = NodeDef.getName(nodeDef)
      const nodeDefUuid = NodeDef.getUuid(nodeDef)
      let value = rowResult[nodeDefName]
      if (value === 'NA') value = null

      const insertValue = {
        [TableResultNode.columnSet.chainUuid]: rowResult[TableResultNode.columnSet.processingChainUuid],
        [TableResultNode.columnSet.stepUuid]: rowResult[TableResultNode.columnSet.processingStepUuid],
        [TableResultNode.columnSet.recordUuid]: rowResult[TableResultNode.columnSet.recordUuid],
        [TableResultNode.columnSet.parentUuid]: rowResult[TableResultNode.columnSet.parentUuid],
        [TableResultNode.columnSet.nodeDefUuid]: nodeDefUuid,
        [TableResultNode.columnSet.value]: value,
      }
      insertValues.push(insertValue)
    })
    return super.push(...insertValues)
  }
}
