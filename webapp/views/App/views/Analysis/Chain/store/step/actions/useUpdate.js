import * as Chain from '@common/analysis/processingChain'

export const useUpdate = ({ chain, setChain, setDirty, setState }) => ({ stepUpdated }) => {
  const chainUpdated = Chain.assocProcessingStep(stepUpdated)(chain)

  setDirty(true)
  setChain(chainUpdated)

  setState({
    step: stepUpdated,
    stepDirty: true,
  })
}
