import * as Chain from '@common/analysis/processingChain'

export const useCreate = ({ chain, setChain, setState }) => {
  return () => {
    const step = Chain.newProcessingStep(chain)
    const chainWithStep = Chain.assocProcessingStep(step)(chain)

    setState({
      step,
      stepOriginal: {},
      stepDirty: true,
    })

    setChain(chainWithStep)
  }
}
