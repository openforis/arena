import * as Chain from '@common/analysis/processingChain'

export const useCreate = ({ chain, setStep, setChain }) => {
  return () => {
    const processingStep = Chain.newProcessingStep(chain)
    const chainWithStep = Chain.assocProcessingStep(processingStep)(chain)
    setStep(processingStep)
    setChain(chainWithStep)
  }
}
