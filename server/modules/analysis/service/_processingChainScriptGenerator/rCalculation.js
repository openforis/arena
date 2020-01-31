import { RFileCalculation } from '@server/modules/analysis/service/_processingChainScriptGenerator/rFile'

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

  async init() {
    await this._rFile.init()

    return this
  }
}
