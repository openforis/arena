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
export const persistStep = ({ step, stepDirty }) => {
  if (A.isEmpty(step)) return
  AnalysisStorage.setStep({ step, stepDirty })
  window.dispatchEvent(new CustomEvent(AnalysisStorage.eventTypes.setStep))
}

export const getStep = () => AnalysisStorage.getStep()

export const resetStep = () => AnalysisStorage.clearStep()

// ===== calculation
export const persistCalculation = ({ calculation, calculationDirty }) => {
  if (A.isEmpty(calculation)) return
  AnalysisStorage.setCalculation({ calculation, calculationDirty })
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
