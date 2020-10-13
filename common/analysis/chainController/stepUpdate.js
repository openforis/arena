import * as R from 'ramda'

import * as Step from '@common/analysis/processingStep'
import * as StepVariable from '@common/analysis/processingStepVariable'
import * as Calculation from '@common/analysis/processingStepCalculation'
import * as ObjectUtils from '@core/objectUtils'
import * as CalculationUpdate from './calculationUpdate'

export const mergeProps = ({ step, props }) => ({ step: ObjectUtils.mergeProps(props)(step) })

const _assocCalculations = ({ step, calculations }) => ({ step: R.assoc(Step.keys.calculations, calculations, step) })

export const assocCalculation = ({ step, calculation }) => ({
  step: R.assocPath([Step.keys.calculations, Calculation.getIndex(calculation)], calculation, step),
})

export const assocCalculationUuids = ({ step, calculationUuids }) => ({
  step: R.assoc(Step.keys.calculationUuids, calculationUuids, step),
})

const _updateCalculations = ({ step, updateFn }) =>
  R.pipe(Step.getCalculations, updateFn, (calculations) => _assocCalculations({ step, calculations }))(step)

export const dissocCalculation = ({ step, calculation }) =>
  _updateCalculations({
    step,
    updateFn: R.pipe(
      // Remove calculation
      R.reject(Calculation.isEqual(calculation)),
      // Update indexes of next calculations
      R.map(
        R.when(
          (calc) => Calculation.getIndex(calc) > Calculation.getIndex(calculation),
          (calc) =>
            R.prop(
              'calculation',
              CalculationUpdate.assocIndex({ calculation: calc, index: Calculation.getIndex(calc) - 1 })
            )
        )
      )
    ),
  })

export const dissocCalculations = ({ step }) => ({ step: R.dissoc(Step.keys.calculations, step) })

export const moveCalculation = ({ step, indexFrom, indexTo }) => {
  const calculations = Step.getCalculations(step)
  const calculationsMoved = R.move(indexFrom, indexTo, calculations)
  const calculationsUpdate = calculationsMoved.map((calculation, index) =>
    R.prop('calculation', CalculationUpdate.assocIndex({ calculation, index }))
  )
  return _assocCalculations({ step, calculations: calculationsUpdate })
}

export const assocVariablesPreviousStep = ({ step, variables }) => ({
  step: ObjectUtils.setProp(Step.keysProps.variablesPreviousStep, variables)(step),
})

export const assocVariablePreviousStep = ({ step, variable }) => {
  const variablesPrevStep = Step.getVariablesPreviousStep(step)
  let index = variablesPrevStep.findIndex(StepVariable.isEqual(variable))
  if (index < 0) {
    // new variable
    index = variablesPrevStep.length
  }
  return { step: R.assocPath([Step.keys.props, Step.keysProps.variablesPreviousStep, index], variable)(step) }
}

export const dissocVariablePreviousStep = ({ step, variableUuid }) => {
  const variablesPrevStep = Step.getVariablesPreviousStep(step)
  const variableIndex = variablesPrevStep.findIndex((variable) => StepVariable.getUuid(variable) === variableUuid)
  if (variableIndex >= 0) {
    const variablesUpdated = [...variablesPrevStep]
    variablesUpdated.splice(variableIndex, 1)
    return assocVariablesPreviousStep({ step, variables: variablesUpdated })
  }
  return { step }
}
