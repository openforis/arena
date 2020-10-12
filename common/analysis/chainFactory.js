import { uuidv4 } from '@core/uuid'

import * as Chain from './processingChain'
import * as Step from './processingStep'
import * as StepVariable from './processingStepVariable'
import * as Calculation from './processingStepCalculation'

export const createChain = ({ props = {} }) => ({
  [Chain.keys.uuid]: uuidv4(),
  [Chain.keys.props]: props,
  [Calculation.keys.temporary]: true,
})

export const createStepVariable = ({ uuid }) => ({
  [StepVariable.keys.uuid]: uuid,
})

const _createVariablesPreviousStep = ({ stepPrev }) =>
  Step.getCalculations(stepPrev).map((calculation) =>
    createStepVariable({ uuid: Calculation.getNodeDefUuid(calculation) })
  )

export const createStep = ({ chain, props = {} }) => {
  const index = Chain.getProcessingSteps(chain).length
  const step = {
    [Step.keys.uuid]: uuidv4(),
    [Step.keys.processingChainUuid]: Chain.getUuid(chain),
    [Step.keys.index]: index,
    [Step.keys.props]: props,
    [Calculation.keys.temporary]: true,
  }
  const stepPrev = Chain.getStepByIdx(index - 1)(chain)
  const variablesPreviousStep = _createVariablesPreviousStep({ stepPrev })
  return Step.assocVariablesPreviousStep(variablesPreviousStep)(step)
}

export const createCalculation = ({ step, nodeDefUuid = null, props = {} }) => ({
  [Calculation.keys.uuid]: uuidv4(),
  [Calculation.keys.processingStepUuid]: Step.getUuid(step),
  [Calculation.keys.index]: Step.getCalculations(step).length,
  [Calculation.keys.nodeDefUuid]: nodeDefUuid,
  [Calculation.keys.props]: props,
  [Calculation.keys.temporary]: true,
})
