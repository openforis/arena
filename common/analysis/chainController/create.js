import { uuidv4 } from '@core/uuid'

import * as ChainFactory from '../chainFactory'
import * as Chain from '../processingChain'
import * as Step from '../processingStep'
import * as Calculation from '../processingStepCalculation'
import * as ChainUpdate from './chainUpdate'
import * as StepUpdate from './stepUpdate'
import { assocCalculation } from './assocCalculation'

const _createVariablesPreviousStep = ({ stepPrev }) =>
  Step.getCalculations(stepPrev).map((calculation) =>
    ChainFactory.createStepVariable({ uuid: Calculation.getNodeDefUuid(calculation) })
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
  const { step: stepUpdated } = StepUpdate.assocVariablesPreviousStep({ step, variables: variablesPreviousStep })

  return { ...ChainUpdate.assocStep({ chain, step: stepUpdated }), step: stepUpdated }
}

export const createCalculation = ({ chain, step, nodeDefUuid = null, props = {} }) => {
  const calculation = {
    [Calculation.keys.uuid]: uuidv4(),
    [Calculation.keys.processingStepUuid]: Step.getUuid(step),
    [Calculation.keys.index]: Step.getCalculations(step).length,
    [Calculation.keys.nodeDefUuid]: nodeDefUuid,
    [Calculation.keys.props]: props,
    [Calculation.keys.temporary]: true,
  }
  return {
    calculation,
    ...assocCalculation({ chain, step, calculation }),
  }
}
