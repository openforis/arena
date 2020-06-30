import * as Chain from '@common/analysis/processingChain'

export const useCreate = ({ chain, setStep, setChain, setOriginalStep, setStepDirty }) => {
  return () => {
    const processingStep = Chain.newProcessingStep(chain)
    const chainWithStep = Chain.assocProcessingStep(processingStep)(chain)
    setStep(processingStep)
    setOriginalStep()
    setStepDirty(true)
    setChain(chainWithStep)
  }
}
