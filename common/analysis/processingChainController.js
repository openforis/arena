import * as Chain from './processingChain'
import * as Step from './processingStep'
import * as StepVariable from './processingStepVariable'
import * as Calculation from './processingStepCalculation'

export const assocCalculation = ({ chain, step, calculation }) => {
  const stepUpdated = Step.assocCalculation(calculation)(step)
  let chainUpdated = Chain.assocProcessingStep(stepUpdated)(chain)
  const stepNext = Chain.getStepNext(step)(chain)
  let stepNextUpdated = null
  if (stepNext) {
    // add variable previous step to next step
    const variableUuid = Calculation.getNodeDefUuid(calculation)
    if (!Step.hasVariablePreviousStep(variableUuid)(stepNext)) {
      const variablePreviousStep = StepVariable.newProcessingStepVariable({ uuid: variableUuid })
      stepNextUpdated = Step.assocVariablePreviousStep(variablePreviousStep)(stepNext)
      chainUpdated = Chain.assocProcessingStep(stepNextUpdated)(chainUpdated)
    }
  }
  return {
    chain: chainUpdated,
    step: stepUpdated,
    stepNextUpdated,
  }
}

export const deleteCalculation = ({ chain, step, calculation }) => {
  const stepUpdated = Step.dissocCalculation(calculation)(step)
  let chainUpdated = Chain.assocProcessingStep(stepUpdated)(chain)
  const stepNext = Chain.getStepNext(step)(chainUpdated)
  let stepNextUpdated = null
  if (stepNext) {
    // dissoc variable associated to calculation from the variablesPrevStep of the next step
    const variableUuid = Calculation.getNodeDefUuid(calculation)
    stepNextUpdated = Step.dissocVariablePreviousStepByUuid(variableUuid)(stepNext)
    chainUpdated = Chain.assocProcessingStep(stepNextUpdated)(chainUpdated)
  }
  return {
    chain: chainUpdated,
    step: stepUpdated,
    stepNextUpdated,
  }
}
