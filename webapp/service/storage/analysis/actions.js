import * as AnalysisStorage from './storage'

// ====== chain
export const persistChain = ({ chain }) => {
  AnalysisStorage.setChain({ chain })
  window.dispatchEvent(new CustomEvent(AnalysisStorage.eventTypes.setChain))
}

export const getChain = () => AnalysisStorage.getChain()

export const resetChain = () => AnalysisStorage.clearChain()

// ===== step
export const persistStep = ({ step }) => {
  AnalysisStorage.setStep({ step })
  window.dispatchEvent(new CustomEvent(AnalysisStorage.eventTypes.setStep))
}

export const getStep = () => AnalysisStorage.getStep()

export const resetStep = () => AnalysisStorage.clearStep()
