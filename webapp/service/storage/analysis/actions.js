import * as A from '@core/arena'

import * as AnalysisStorage from './storage'

// ====== chain
export const persistChain = ({ chain }) => {
  if (A.isEmpty(chain)) return
  AnalysisStorage.setChain({ chain })
  window.dispatchEvent(new CustomEvent(AnalysisStorage.eventTypes.setChain))
}

export const getChain = () => AnalysisStorage.getChain()

export const resetChain = () => AnalysisStorage.clearChain()

// ===== step
export const persistStep = ({ step }) => {
  if (A.isEmpty(step)) return
  AnalysisStorage.setStep({ step })
  window.dispatchEvent(new CustomEvent(AnalysisStorage.eventTypes.setStep))
}

export const getStep = () => AnalysisStorage.getStep()

export const resetStep = () => AnalysisStorage.clearStep()

// ===== calculation
export const persistCalculation = ({ calculation }) => {
  if (A.isEmpty(calculation)) return
  AnalysisStorage.setCalculation({ calculation })
  window.dispatchEvent(new CustomEvent(AnalysisStorage.eventTypes.setCalculation))
}

export const getCalculation = () => AnalysisStorage.getCalculation()

export const resetCalculation = () => AnalysisStorage.clearCalculation()

// ==== Analysus
export const resetAnalysis = () => {
  resetChain()
  resetStep()
  resetCalculation()
}
