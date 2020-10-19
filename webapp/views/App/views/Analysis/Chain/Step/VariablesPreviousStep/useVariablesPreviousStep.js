import { useState } from 'react'

import * as A from '@core/arena'
import * as Validation from '@core/validation/validation'
import * as ChainFactory from '@common/analysis/chainFactory'
import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'
import * as StepVariable from '@common/analysis/stepVariable'
import * as Calculation from '@common/analysis/processingStepCalculation'

import { State } from '../../store'

export const useVariablesPreviousStep = ({ state }) => {
  const [variableEdit, setVariableEditState] = useState(null)
  const [variableHighlightedUuid, setVariableHighlightedUuid] = useState(null)

  const chain = State.getChainEdit(state)
  const step = State.getStepEdit(state)
  const stepPrev = Chain.getStepPrev(step)(chain)
  const stepPrevEntityDefUuid = Step.getEntityUuid(stepPrev)
  const variablesPrevStepIncluded = Step.getVariablesPreviousStep(step)

  const variables = Step.getCalculations(stepPrev).map((calculation) => {
    const variableUuid = Calculation.getNodeDefUuid(calculation)
    const variablePrevStep = variablesPrevStepIncluded[variableUuid]
    return variablePrevStep
      ? { ...variablePrevStep, [StepVariable.keys.include]: true }
      : ChainFactory.createStepVariable({ variableUuid })
  })

  const setVariableEdit = (variableEditNew) => {
    // highlight last edited variable when edit completes
    setVariableHighlightedUuid(variableEdit ? StepVariable.getUuid(variableEdit) : null)
    setVariableEditState(variableEditNew)
  }

  const validation = A.pipe(
    Chain.getItemValidationByUuid(Step.getUuid(step)),
    Validation.getFieldValidation(Step.keysProps.variablesPreviousStep)
  )(chain)

  return {
    variables,
    variableHighlightedUuid,
    validation,
    variableEdit,
    setVariableEdit,
    stepPrevEntityDefUuid,
  }
}
