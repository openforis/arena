import * as ProcessingStep from '@common/analysis/processingStep'

import * as FileUtils from '@server/utils/file/fileUtils'

import { padStart } from './rFile'

export default class RStep {
  constructor(surveyId, rChain, step) {
    this._surveyId = surveyId
    this._rChain = rChain
    this._step = step

    this._path = FileUtils.join(this._rChain.dirUser, RStep.getSubFolder(step))
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

  async _initDir() {
    await FileUtils.mkdir(this._path)
  }

  async init() {
    await this._initDir()

    return this
  }
}

RStep.getSubFolder = (step) => {
  const stepIndex = padStart(ProcessingStep.getIndex(step) + 1)
  return `step-${stepIndex}`
}
