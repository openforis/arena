import * as ProcessingStep from '@common/analysis/processingStep'

import * as FileUtils from '@server/utils/file/fileUtils'

import * as ProcessingChainManager from '@server/modules/analysis/manager/processingChainManager'

import RCalculation from '@server/modules/analysis/service/_processingChainScriptGenerator/rCalculation'
import { padStart } from '@server/modules/analysis/service/_processingChainScriptGenerator/rFile'

export default class RStep {
  constructor(surveyId, rChain, step) {
    this._surveyId = surveyId
    this._rChain = rChain
    this._step = step

    const stepIndex = padStart(ProcessingStep.getIndex(this._step) + 1)
    this._path = FileUtils.join(this._rChain.dirUser, `step-${stepIndex}`)
  }

  get path() {
    return this._path
  }

  get rChain() {
    return this._rChain
  }

  async _initDir() {
    await FileUtils.mkdir(this._path)
  }

  async _initCalculations() {
    const calculations = await ProcessingChainManager.fetchCalculationsByStepUuid(
      this._surveyId,
      ProcessingStep.getUuid(this._step),
    )
    for (const calculation of calculations) {
      await new RCalculation(this, calculation).init()
    }
  }

  async init() {
    await this._initDir()
    await this._initCalculations()

    return this
  }
}
