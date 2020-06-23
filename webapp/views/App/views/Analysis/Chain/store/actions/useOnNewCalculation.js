import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

export const useOnNewCalculation = ({ chain, step, setStep, setCalculation }) => {
  return () => {
    const calculation = Chain.newProcessingStepCalculation(step)

    const processingStep = Chain.newProcessingStep(chain)

    const stepWithCalculation = Step.assocCalculations([...Step.getCalculations(step), calculation])(processingStep)
    setStep(stepWithCalculation)
    setCalculation(calculation)
  }
}
