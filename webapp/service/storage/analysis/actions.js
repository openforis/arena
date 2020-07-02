import * as AnalysisStorage from './storage'

// ====== chain
export const persistChain = ({ chain }) => {
  AnalysisStorage.setChain({ chain })
  window.dispatchEvent(new CustomEvent(AnalysisStorage.eventTypes.setChain))
}

// ===== step
export const persistStep = ({ step, stepDirty }) => {
  AnalysisStorage.setStep({ step, stepDirty })
  window.dispatchEvent(new CustomEvent(AnalysisStorage.eventTypes.setStep))
}

// ===== calculation
export const persistCalculation = ({ calculation, calculationDirty }) => {
  AnalysisStorage.setCalculation({ calculation, calculationDirty })
  window.dispatchEvent(new CustomEvent(AnalysisStorage.eventTypes.setCalculation))
}

// ==== Analysus
export const get = () => {
  const chain = AnalysisStorage.getChain()
  const { step, stepDirty } = AnalysisStorage.getStep()
  const { calculation, calculationDirty } = AnalysisStorage.getCalculation()

  return { chain, step, stepDirty, calculation, calculationDirty }
}
export const reset = () => {
  AnalysisStorage.removeChain()
  AnalysisStorage.removeStep()
  AnalysisStorage.removeCalculation()
}

export const persist = (analysis) => {
  persistChain(analysis)
  persistStep(analysis)
  persistCalculation(analysis)
}
