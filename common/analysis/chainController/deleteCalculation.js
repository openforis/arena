import * as A from '@core/arena'

import * as Chain from '../processingChain'
import * as Calculation from '../processingStepCalculation'
import * as ChainUpdate from './chainUpdate'
import * as StepUpdate from './stepUpdate'

export const deleteCalculation = ({ chain, step, calculation }) => {
  const { step: stepUpdated } = StepUpdate.dissocCalculation({ step, calculation })
  let { chain: chainUpdated } = ChainUpdate.assocStep({ chain, step: stepUpdated })
  const stepNext = Chain.getStepNext(step)(chainUpdated)
  let stepNextUpdated = null
  if (stepNext) {
    // dissoc variable associated to calculation from the variablesPrevStep of the next step
    const variableUuid = Calculation.getNodeDefUuid(calculation)
    const { step: stepNextWitoutVariable } = StepUpdate.dissocVariablePreviousStep({ step: stepNext, variableUuid })
    stepNextUpdated = stepNextWitoutVariable
    chainUpdated = A.prop('chain', ChainUpdate.assocStep({ chain: chainUpdated, step: stepNextUpdated }))
  }
  return {
    chain: chainUpdated,
    step: stepUpdated,
    stepNextUpdated,
  }
}
