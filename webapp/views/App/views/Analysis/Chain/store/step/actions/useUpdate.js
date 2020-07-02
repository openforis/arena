import * as Chain from '@common/analysis/processingChain'

export const useUpdate = ({ setStep, chain, setChain, setDirty, setStepDirty }) => ({ stepUpdated }) => {
  const chainUpdated = Chain.assocProcessingStep(stepUpdated)(chain)

  setDirty(true)
  setChain(chainUpdated)
  setStep(stepUpdated)
  setStepDirty(true)
}
