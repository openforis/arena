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
  const step = ChainFactory.createStep({ chain, props })
  const stepPrev = Chain.getStepPrev(step)(chain)
  const variablesPreviousStep = _createVariablesPreviousStep({ stepPrev })
  const { step: stepUpdated } = StepUpdate.assocVariablesPreviousStep({ step, variables: variablesPreviousStep })

  return { ...ChainUpdate.assocStep({ chain, step: stepUpdated }), step: stepUpdated }
}

export const createCalculation = ({ chain, step, nodeDefUuid = null, props = {} }) => {
  const calculation = ChainFactory.createCalculation({ step, nodeDefUuid, props })

  return {
    calculation,
    ...assocCalculation({ chain, step, calculation }),
  }
}
