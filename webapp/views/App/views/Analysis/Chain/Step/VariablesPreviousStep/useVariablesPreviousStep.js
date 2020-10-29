import * as A from '@core/arena'
import * as Validation from '@core/validation/validation'
import * as ChainFactory from '@common/analysis/chainFactory'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as StepVariable from '@common/analysis/stepVariable'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { State } from '../../store'

export const useVariablesPreviousStep = ({ state }) => {
  const chain = State.getChainEdit(state)
  const step = State.getStepEdit(state)
  const stepPrev = Chain.getStepPrev(step)(chain)
  const variablesPrevStepIncluded = Step.getVariablesPreviousStep(step)

  const variables = Step.getCalculations(stepPrev).map((calculation) => {
    const variableUuid = Calculation.getNodeDefUuid(calculation)
    const variablePrevStep = variablesPrevStepIncluded[variableUuid]
    return variablePrevStep
      ? { ...variablePrevStep, [StepVariable.keys.include]: true }
      : ChainFactory.createStepVariable({ variableUuid })
  })

  const variableHighlightedUuid = State.getVariablePrevStepUuidHighlighted(state)

  const validation = A.pipe(
    Chain.getItemValidationByUuid(Step.getUuid(step)),
    Validation.getFieldValidation(Step.keysProps.variablesPreviousStep)
  )(chain)

  return {
    variables,
    validation,
    variableHighlightedUuid,
  }
}
