import * as Chain from '@common/analysis/processingChain'

export const useCreate = ({ chainState, ChainState, setState }) => {
  return () => {
    const chain = ChainState.getChain(chainState)
    const step = Chain.newProcessingStep(chain)
    const chainWithStep = Chain.assocProcessingStep(step)(chain)

    setState({
      step,
      stepOriginal: {},
      stepDirty: true,
    })

    ChainState.setState({
      chain: chainWithStep,
    })
  }
}
