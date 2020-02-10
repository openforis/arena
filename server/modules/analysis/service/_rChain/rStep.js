import * as ProcessingStep from '@common/analysis/processingStep'

import * as FileUtils from '@server/utils/file/fileUtils'

import RCalculation from '@server/modules/analysis/service/_rChain/rCalculation'
import { padStart } from '@server/modules/analysis/service/_rChain/rFile'

export default class RStep {
  constructor(surveyId, rChain, step) {
    this._surveyId = surveyId
    this._rChain = rChain
    this._step = step

    const stepIndex = padStart(ProcessingStep.getIndex(this.step) + 1)
    this._path = FileUtils.join(this._rChain.dirUser, `step-${stepIndex}`)
    this._rCalculations = []
  }

  get path() {
    return this._path
  }

  get rChain() {
    return this._rChain
  }

  get step() {
    return this._step
  }

  get rCalculations() {
    return this._rCalculations
  }

  async _initDir() {
    await FileUtils.mkdir(this._path)
  }

  async _initCalculations() {
    const calculations = ProcessingStep.getCalculations(this.step)

    for (const calculation of calculations) {
      const rCalculation = await new RCalculation(this, calculation).init()
      this._rCalculations.push(rCalculation)
    }
  }

  async init() {
    await this._initDir()
    await this._initCalculations()

    return this
  }
}
