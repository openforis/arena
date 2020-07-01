import * as Chain from '@common/analysis/processingChain'

export const useCreate = ({ chain, setStep, setChain, setStepOriginal, setStepDirty }) => {
  return () => {
    const processingStep = Chain.newProcessingStep(chain)
    const chainWithStep = Chain.assocProcessingStep(processingStep)(chain)
    setStep(processingStep)
    setStepOriginal()
    setStepDirty(true)
    setChain(chainWithStep)
  }
}
