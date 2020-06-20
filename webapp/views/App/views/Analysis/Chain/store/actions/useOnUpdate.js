import * as ProcessingChain from '@common/analysis/processingChain'

export const useOnUpdate = ({ chain, setChain }) => ({ name, value }) => {
  const chainUpdated = ProcessingChain.assocProp(name, value)(chain)
  setChain(chainUpdated)
}
