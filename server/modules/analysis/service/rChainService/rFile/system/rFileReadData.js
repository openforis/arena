import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStep from '@common/analysis/processingStep'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as ApiRoutes from '@common/apiRoutes'

import RFileSystem from './rFileSystem'
import { dfVar, setVar, arenaGet, asNumeric } from '../../rFunctions'

export default class RFileReadData extends RFileSystem {
  constructor(rChain) {
    super(rChain, 'read-data')
  }

  async initSteps(steps) {
    const { survey, cycle } = this.rChain

    await Promise.all(
      steps.map(async (step) => {
        // Fetch entity data
        const getEntityData = arenaGet(
          ApiRoutes.rChain.stepEntityData(Survey.getId(survey), cycle, ProcessingStep.getUuid(step))
        )
        const entityDef = Survey.getNodeDefByUuid(ProcessingStep.getEntityUuid(step))(survey)
        const dfEntity = NodeDef.getName(entityDef)
        await this.appendContent(setVar(dfEntity, getEntityData))

        // Convert numeric node def values
        const contentConvertNumericFields = []
        Survey.visitAncestorsAndSelf(entityDef, (ancestorDef) => {
          Survey.getNodeDefChildren(ancestorDef)(survey)
            .filter((nodeDef) => NodeDef.isDecimal(nodeDef) || NodeDef.isInteger(nodeDef))
            .forEach((nodeDef) => {
              const nodeDefDfVar = dfVar(dfEntity, NodeDefTable.getColName(nodeDef))
              contentConvertNumericFields.push(setVar(nodeDefDfVar, asNumeric(nodeDefDfVar)))
            })
        })(survey)
        await this.appendContent(...contentConvertNumericFields)
      })
    )
  }

  async init() {
    await super.init()
    this.initSteps = this.initSteps.bind(this)

    const { chain } = this.rChain
    const steps = ProcessingChain.getProcessingSteps(chain).filter(ProcessingStep.hasEntity)
    await this.initSteps(steps)

    return this
  }
}
