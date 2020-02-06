import * as R from 'ramda'

import * as ResultNodeTable from '@common/surveyRdb/resultNodeTable'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as DataTable from '@server/modules/surveyRdb/schemaRdb/dataTable'
import * as DataView from '@server/modules/surveyRdb/schemaRdb/dataView'
import { RFileSystem } from '@server/modules/analysis/service/_rChain/rFile'
import { dbWriteTable, dfVar, setVar } from '@server/modules/analysis/service/_rChain/rFunctions'

export default class RFilePersistResults extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'persist-results')
  }

  async init() {
    await super.init()

    const chain = this.rChain.chain
    const survey = this.rChain.survey
    const chainUuid = ProcessingChain.getUuid(chain)
    const steps = ProcessingChain.getProcessingSteps(chain)

    for (const step of steps) {
      if (ProcessingStep.hasEntity(step)) {
        const res = 'res'
        const entityDef = R.pipe(ProcessingStep.getEntityUuid, entityUuid =>
          Survey.getNodeDefByUuid(entityUuid)(survey),
        )(step)

        for (const calculation of ProcessingStep.getCalculations(step)) {
          const nodeDefCalculationName = R.pipe(
            ProcessingStepCalculation.getNodeDefUuid,
            nodeDefUuid => Survey.getNodeDefByUuid(nodeDefUuid)(survey),
            NodeDef.getName,
          )(calculation)
          /*
          Await this.appendContent(
            setVar(res, NodeDef.getName(entityDef)),
            setVar(dfVar(res, ResultNodeTable.colNames.uuid), dfVar(res, `${nodeDefCalculationName}_uuid`)),
            setVar(dfVar(res, ResultNodeTable.colNames.processingChainUuid), `'${chainUuid}'`),
            setVar(dfVar(res, ResultNodeTable.colNames.processingStepUuid), `'${ProcessingStep.getUuid(step)}'`),
            setVar(dfVar(res, ResultNodeTable.colNames.recordUuid), dfVar(res, DataTable.colNameRecordUuuid)),
            setVar(dfVar(res, ResultNodeTable.colNames.parentUuid), dfVar(res, DataView.getColUuid(entityDef))),
            setVar(
              dfVar(res, ResultNodeTable.colNames.nodeDefUuid),
              `'${ProcessingStepCalculation.getUuid(calculation)}'`,
            ),
            setVar(dfVar(res, ResultNodeTable.colNames.value), dfVar(res, nodeDefCalculationName)),

            dbWriteTable(ResultNodeTable.tableName, res, true),
          )
          */
        }
      }
    }

    return this
  }
}
