import * as Chain from '../processingChain'
import * as Step from '../processingStep'
import * as Calculation from '../processingStepCalculation'
import * as ChainUpdate from './chainUpdate'

export const deleteCalculation = ({ chain, step, calculation }) => {
  const stepUpdated = Step.dissocCalculation(calculation)(step)
  let chainUpdated = ChainUpdate.assocStep({ chain, step: stepUpdated })
  const stepNext = Chain.getStepNext(step)(chainUpdated)
  let stepNextUpdated = null
  if (stepNext) {
    // dissoc variable associated to calculation from the variablesPrevStep of the next step
    const variableUuid = Calculation.getNodeDefUuid(calculation)
    stepNextUpdated = Step.dissocVariablePreviousStepByUuid(variableUuid)(stepNext)
    chainUpdated = ChainUpdate.assocStep({ chain: chainUpdated, step: stepNextUpdated })
  }
  return {
    chain: chainUpdated,
    step: stepUpdated,
    stepNextUpdated,
  }
}
