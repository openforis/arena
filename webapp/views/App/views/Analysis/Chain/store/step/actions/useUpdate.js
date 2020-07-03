import * as Chain from '@common/analysis/processingChain'

export const useUpdate = ({ chainState, ChainState, setState }) => ({ stepUpdated }) => {
  const chainUpdated = Chain.assocProcessingStep(stepUpdated)(ChainState.getChain(chainState))

  ChainState.setState({
    chain: chainUpdated,
    dirty: true,
  })

  setState({
    step: stepUpdated,
    stepDirty: true,
  })
}
