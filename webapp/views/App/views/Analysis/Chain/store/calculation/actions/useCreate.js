import * as Chain from '@common/analysis/processingChain'
import * as Step from '@common/analysis/processingStep'

export const useCreate = ({
  chain,
  setChain,
  step,
  setStep,
  setCalculation,
  setCalculationDirty,
  setCalculationOriginal,
}) => {
  return () => {
    const calculation = Chain.newProcessingStepCalculation(step)

    const stepWithCalculation = Step.assocCalculation(calculation)(step)
    const chainWithStep = Chain.assocProcessingStep(stepWithCalculation)(chain)

    setChain(chainWithStep)
    setStep(stepWithCalculation)
    setCalculation(calculation)
    setCalculationOriginal({})
    setCalculationDirty(true)
  }
}
