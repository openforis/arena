import * as Chain from '@common/analysis/processingChain'

import { AnalysisActions } from '@webapp/service/storage'

import { useSurveyCycleKey } from '@webapp/store/survey'

export const useOnInit = ({ setChain, setStep, setCalculation }) => {
  const surveyCycleKey = useSurveyCycleKey()

  const chainSaved = AnalysisActions.getChain()
  const stepSaved = AnalysisActions.getStep()
  const calculationSaved = AnalysisActions.getCalculation()

  return () => {
    if (chainSaved) {
      setChain(chainSaved)
      if (stepSaved) {
        setStep(stepSaved)
        if (calculationSaved) {
          setCalculation(calculationSaved)
        }
      }
    } else {
      const newChain = Chain.newProcessingChain({
        [Chain.keysProps.cycles]: [surveyCycleKey],
      })

      setChain(newChain)
    }
  }
}
