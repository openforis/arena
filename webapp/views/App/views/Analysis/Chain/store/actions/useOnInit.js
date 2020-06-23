import * as Chain from '@common/analysis/processingChain'

import { AnalysisActions } from '@webapp/service/storage'

import { useSurveyCycleKey } from '@webapp/store/survey'

export const useOnInit = ({ setChain, setStep }) => {
  const surveyCycleKey = useSurveyCycleKey()

  const chainSaved = AnalysisActions.getChain()
  const stepSaved = AnalysisActions.getStep()

  return () => {
    if (chainSaved) {
      setChain(chainSaved)
      if (stepSaved) {
        setStep(stepSaved)
      }
    } else {
      const newChain = Chain.newProcessingChain({
        [Chain.keysProps.cycles]: [surveyCycleKey],
      })

      setChain(newChain)
    }
  }
}
