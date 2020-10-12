import * as ChainFactory from '../chainFactory'
import * as Chain from '../processingChain'
import * as Step from '../processingStep'
import * as Calculation from '../processingStepCalculation'
import * as ChainUpdate from './chainUpdate'

export const assocCalculation = ({ chain, step, calculation }) => {
  const stepUpdated = Step.assocCalculation(calculation)(step)
  let chainUpdated = ChainUpdate.assocStep({ chain, step: stepUpdated })
  const stepNext = Chain.getStepNext(step)(chain)
  let stepNextUpdated = null
  if (stepNext) {
    // add variable previous step to next step
    const variableUuid = Calculation.getNodeDefUuid(calculation)
    if (!Step.hasVariablePreviousStep(variableUuid)(stepNext)) {
      const variablePreviousStep = ChainFactory.createStepVariable({ uuid: variableUuid })
      stepNextUpdated = Step.assocVariablePreviousStep(variablePreviousStep)(stepNext)
      chainUpdated = ChainUpdate.assocStep({ chain: chainUpdated, step: stepNextUpdated })
    }
  }
  return {
    chain: chainUpdated,
    step: stepUpdated,
    stepNextUpdated,
  }
}
