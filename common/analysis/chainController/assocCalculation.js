import * as A from '@core/arena'

import * as ChainFactory from '../chainFactory'
import * as Chain from '../processingChain'
import * as Step from '../processingStep'
import * as Calculation from '../processingStepCalculation'
import * as ChainUpdate from './chainUpdate'
import * as StepUpdate from './stepUpdate'

export const assocCalculation = ({ chain, step, calculation }) => {
  const { step: stepUpdated } = StepUpdate.assocCalculation({ step, calculation })
  let { chain: chainUpdated } = ChainUpdate.assocStep({ chain, step: stepUpdated })
  const stepNext = Chain.getStepNext(step)(chainUpdated)
  let stepNextUpdated = null
  if (stepNext) {
    // add variable previous step to next step
    const variableUuid = Calculation.getNodeDefUuid(calculation)
    if (!Step.hasVariablePreviousStep(variableUuid)(stepNext)) {
      const variable = ChainFactory.createStepVariable({ uuid: variableUuid })
      stepNextUpdated = A.prop(
        'step',
        StepUpdate.assocVariablePreviousStep({
          step: stepNext,
          variable,
        })
      )
      chainUpdated = A.prop('chain', ChainUpdate.assocStep({ chain: chainUpdated, step: stepNextUpdated }))
    }
  }
  return {
    chain: chainUpdated,
    step: stepUpdated,
    stepNext: stepNextUpdated,
  }
}
