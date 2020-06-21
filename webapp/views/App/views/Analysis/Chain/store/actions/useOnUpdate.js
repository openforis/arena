import * as ProcessingChain from '@common/analysis/processingChain'

export const useOnUpdate = ({ chain, setChain, setDirty }) => ({ name, value }) => {
  const chainUpdated = ProcessingChain.assocProp(name, value)(chain)
  setDirty(true)
  setChain(chainUpdated)
}
