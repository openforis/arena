import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as FileUtils from '@server/utils/file/fileUtils'

export const padStart = StringUtils.padStart(3, '0')

class RFile {
  constructor(rChain, dir, fileName) {
    this._rChain = rChain
    this._dir = dir
    const fileIndex = padStart(this._rChain.scriptIndexNext)
    this._path = FileUtils.join(this._dir, `${fileIndex}-${fileName}.R`)
    this._pathRelative = R.pipe(
      R.split(ProcessingChain.getUuid(this._rChain.chain) + FileUtils.sep),
      R.last,
    )(this._path)
  }

  get path() {
    return this._path
  }

  async init() {
    await FileUtils.appendFile(this.path)
    await FileUtils.appendFile(
      this._rChain.fileArena,
      `source("${this._pathRelative}")${StringUtils.NEW_LINE}${StringUtils.NEW_LINE}`,
    )
  }
}

export class RFileSystem extends RFile {
  constructor(rChain, fileName) {
    super(rChain, rChain.dirSystem, fileName)
  }
}

export class RFileUser extends RFile {
  constructor(rChain, fileName) {
    super(rChain, rChain.dirUser, fileName)
  }
}

export class RFileCalculation extends RFile {
  constructor(rStep, calculation) {
    const rChain = rStep.rChain
    const survey = rChain.survey
    const nodeDefUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)
    const nodeDefName = R.pipe(Survey.getNodeDefByUuid(nodeDefUuid), NodeDef.getName)(survey)

    super(rChain, rStep.path, nodeDefName)
  }
}
