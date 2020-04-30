import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as ProcessingStepCalculation from '@common/analysis/processingStepCalculation'

import RFile from '../rFile'

export default class RFileCalculation extends RFile {
  constructor(rStep, calculation) {
    const { rChain } = rStep
    const { survey } = rChain
    const nodeDefUuid = ProcessingStepCalculation.getNodeDefUuid(calculation)
    const nodeDefName = R.pipe(Survey.getNodeDefByUuid(nodeDefUuid), NodeDef.getName)(survey)

    super(rChain, rStep.path, nodeDefName)
  }
}
