import * as Chain from '@common/analysis/processingChain'

import { AnalysisActions } from '@webapp/service/storage'

export const useUpdate = ({ setStep, chain, setChain, setDirty, setStepDirty }) => ({ stepUpdated }) => {
  const chainUpdated = Chain.assocProcessingStep(stepUpdated)(chain)

  setDirty(true)
  setChain(chainUpdated)
  setStep(stepUpdated)
  setStepDirty(true)
  AnalysisActions.persistStep({ step: stepUpdated, stepDirty: true })
  AnalysisActions.persistChain({ chain: chainUpdated })
}
