import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import * as DataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'

import { dbGetQuery, setVar } from '@server/modules/analysis/service/_rChain/rFunctions'

export default class RFileReadData extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'read-data')
  }

  async init() {
    await super.init()

    const survey = this.rChain.survey
    const cycle = this.rChain.cycle
    const steps = ProcessingChain.getProcessingSteps(this.rChain.chain)

    const schema = SchemaRdb.getName(Survey.getId(survey))

    for (const step of steps) {
      if (ProcessingStep.hasEntity(step)) {
        const entityDef = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)
        const entityDefParent = Survey.getNodeDefParent(entityDef)(survey)
        const viewName = NodeDefTable.getViewName(entityDef, entityDefParent)
        const fields = ProcessingStep.getCalculations(step).reduce((fieldsAcc, calculation) => {
          const nodeDefUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)
          const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
          const nodeDefName = NodeDef.getName(nodeDef)
          return `${fieldsAcc}, uuid_generate_v4() as ${nodeDefName}_uuid`
        }, '*')
        const selectData = dbGetQuery(schema, viewName, fields, [`${DataTable.colNameRecordCycle} = '${cycle}'`])
        const setEntityData = setVar(NodeDef.getName(entityDef), selectData)
        await this.appendContent(setEntityData)
      }
    }

    return this
  }
}
