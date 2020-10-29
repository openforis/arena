import * as R from 'ramda'

import * as Step from '@common/analysis/processingStep'
import * as StepVariable from '@common/analysis/stepVariable'
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

const _updateVariablesPrevStep = ({ step, updateFn }) => {
  const variables = Step.getVariablesPreviousStep(step)
  const variablesUpdated = updateFn(variables)
  return { step: ObjectUtils.setProp(Step.keysProps.variablesPreviousStep, variablesUpdated)(step) }
}

export const assocVariablePreviousStep = ({ step, variable }) =>
  _updateVariablesPrevStep({ step, updateFn: R.assoc(StepVariable.getUuid(variable), variable) })

export const dissocVariablePreviousStep = ({ step, variableUuid }) =>
  _updateVariablesPrevStep({ step, updateFn: R.dissoc(variableUuid) })
