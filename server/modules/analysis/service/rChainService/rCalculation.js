import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import * as ProcessingStep from '@common/analysis/processingStep'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import RFileCalculation from './rFile/calculation'
import { dfVar, NA, setVar } from './rFunctions'

export default class RCalculation {
  constructor(rStep, calculation) {
    this._rStep = rStep
    this._calculation = calculation
    this._rFile = new RFileCalculation(this.rStep, this._calculation)
  }

  get rStep() {
    return this._rStep
  }

  get calculation() {
    return this._calculation
  }

  get rFile() {
    return this._rFile
  }

  async init() {
    await this.rFile.init()

    const { step, rChain } = this.rStep
    const { survey } = rChain

    if (ProcessingStep.hasEntity(step)) {
      const entityName = R.pipe(
        ProcessingStep.getEntityUuid,
        (uuid) => Survey.getNodeDefByUuid(uuid)(survey),
        NodeDef.getName
      )(step)

      const attributeName = R.pipe(
        ProcessingStepCalculation.getNodeDefUuid,
        (uuid) => Survey.getNodeDefByUuid(uuid)(survey),
        NodeDef.getName
      )(this.calculation)

      await this.rFile.appendContent(setVar(dfVar(entityName, attributeName), NA))
    }

    return this
  }
}
