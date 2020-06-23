import * as R from 'ramda'
import * as Step from '@common/analysis/processingStep'
import * as Calculation from '@common/analysis/processingStepCalculation'

export const useMove = ({ step, setStep }) => {
  return ({ indexFrom, indexTo }) => {
    const calculations = Step.getCalculations(step)
    const calculationsMoved = R.move(indexFrom, indexTo, calculations || [])
    const calculationsUpdate = calculationsMoved.map((calculation, idx) => Calculation.assocIndex(idx)(calculation))
    const stepUpdated = Step.assocCalculations(calculationsUpdate)(step)
    setStep(stepUpdated)
  }
}
