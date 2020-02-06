import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as StringUtils from '@core/stringUtils'

import * as ProcessingChain from '@common/analysis/processingChain'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import * as FileUtils from '@server/utils/file/fileUtils'
import { arenaInfo } from '@server/modules/analysis/service/_rChain/rFunctions'

export const padStart = StringUtils.padStart(3, '0')

const _contentLineSeparator = StringUtils.NEW_LINE + StringUtils.NEW_LINE

class RFile {
  constructor(rChain, dir, fileName) {
    this._rChain = rChain
    this._dir = dir
    const fileIndex = padStart(this._rChain.scriptIndexNext)
    this._fileName = `${fileIndex}-${fileName}.R`
    this._path = FileUtils.join(this._dir, this._fileName)
    this._pathRelative = R.pipe(
      R.split(ProcessingChain.getUuid(this._rChain.chain) + FileUtils.sep),
      R.last,
    )(this._path)
  }

  get rChain() {
    return this._rChain
  }

  get path() {
    return this._path
  }

  async appendContent(...contentItems) {
    await FileUtils.appendFile(this.path, contentItems.join(_contentLineSeparator) + _contentLineSeparator)
    return this
  }

  async logInfo(content) {
    return await this.appendContent(arenaInfo(this._fileName, content))
  }

  async init() {
    await FileUtils.appendFile(this.path)
    await FileUtils.appendFile(
      this._rChain.fileArena,
      `source("${this._pathRelative}")${StringUtils.NEW_LINE}${StringUtils.NEW_LINE}`,
    )
    return this
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
