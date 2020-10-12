import { uuidv4 } from '@core/uuid'

import * as Chain from './processingChain'
import * as Step from './processingStep'
import * as Calculation from './processingStepCalculation'

export const newProcessingChain = ({ props = {} }) => ({
  [Chain.keys.uuid]: uuidv4(),
  [Chain.keys.props]: props,
  [Calculation.keys.temporary]: true,
})

export const newProcessingStep = ({ chain, props = {} }) => {
  const index = Chain.getProcessingSteps(chain).length
  const step = {
    [Step.keys.uuid]: uuidv4(),
    [Step.keys.processingChainUuid]: Chain.getUuid(chain),
    [Step.keys.index]: index,
    [Step.keys.props]: props,
    [Calculation.keys.temporary]: true,
  }
  const previousStep = Chain.getStepByIdx(index - 1)(chain)
  return Step.initializeVariablesPreviousStep({ previousStep })(step)
}

export const newProcessingStepCalculation = ({ step, nodeDefUuid = null, props = {} }) => ({
  [Calculation.keys.uuid]: uuidv4(),
  [Calculation.keys.processingStepUuid]: Step.getUuid(step),
  [Calculation.keys.index]: Step.getCalculations(step).length,
  [Calculation.keys.nodeDefUuid]: nodeDefUuid,
  [Calculation.keys.props]: props,
  [Calculation.keys.temporary]: true,
})
