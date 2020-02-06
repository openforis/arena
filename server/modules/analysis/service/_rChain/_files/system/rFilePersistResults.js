import * as R from 'ramda'

import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as DataView from '@server/modules/surveyRdb/schemaRdb/dataView'
import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'
import { dbWriteTable, dfVar, setVar } from '@server/modules/analysis/service/_rChain/rFunctions'

export default class RFilePersistResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'persist-results')
  }
  /*
  Async init() {
    await super.init()

    const chainUuid = this.rChain.chainUuid
    const survey = this.rChain.survey
    const steps = ProcessingChain.getProcessingSteps(this.rChain.chain)

    for (const step of steps) {
      if (ProcessingStep.hasEntity(step)) {
        const res = 'res'
        const entityDef = R.pipe(
          ProcessingStep.getEntityUuid,
          entityUuid => Survey.getNodeDefByUuid(entityUuid)(survey),
        )(step)

        for (const calculation of ProcessingStep.getCalculations(step)) {
          const nodeDefCalculationName = R.pipe(
            ProcessingStepCalculation.getNodeDefUuid,
            nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey),
            NodeDef.getName,
          )(calculation)

          await this.appendContent(setVar(res, NodeDef.getName(entityDef)))
          await this.appendContent(setVar(dfVar(res, 'uuid'), dfVar(res, `${nodeDefCalculationName}_uuid`)))
          await this.appendContent(setVar(dfVar(res, ResultNodeTable.colNames.processingChainUuid), `'${chainUuid}'`))
          await this.appendContent(setVar(dfVar(res, ResultNodeTable.colNames.processingStepUuid), `'${ProcessingStep.getUuid(step)}'`))
          await this.appendContent(setVar(dfVar(res, ResultNodeTable.colNames.parentUuid), dfVar(res, DataView.getColUuid(entityDef))))
          await this.appendContent(setVar(dfVar(res, ResultNodeTable.colNames.nodeDefUuid), `'${ProcessingStepCalculation.getUuid(calculation)}'`))
//          await this.appendContent(setVar(dfVar(res, ResultNodeTable.colNames.value), dfVar(res, nodeDefCalculationName)))

          await this.appendContent(dbWriteTable(ResultNodeTable.tableName, res, true))
        }
      }
    }

    return this
  }
  */
}
