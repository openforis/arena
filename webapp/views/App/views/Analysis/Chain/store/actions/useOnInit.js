import * as ProcessingChain from '@common/analysis/processingChain'

import { useSurveyCycleKey } from '@webapp/store/survey'

export const useOnInit = ({ setChain }) => {
  const surveyCycleKey = useSurveyCycleKey()

  return () => {
    const newChain = ProcessingChain.newProcessingChain({
      [ProcessingChain.keysProps.cycles]: [surveyCycleKey],
    })

    setChain(newChain)
  }
}
