import * as ProcessingChain from '@common/analysis/processingChain'

import { AnalysisActions } from '@webapp/service/storage'

import { useSurveyCycleKey } from '@webapp/store/survey'

export const useOnInit = ({ setChain }) => {
  const surveyCycleKey = useSurveyCycleKey()

  const chainSaved = AnalysisActions.getChain()

  return () => {
    if (chainSaved) {
      setChain(chainSaved)
    } else {
      const newChain = ProcessingChain.newProcessingChain({
        [ProcessingChain.keysProps.cycles]: [surveyCycleKey],
      })

      setChain(newChain)
    }
  }
}
