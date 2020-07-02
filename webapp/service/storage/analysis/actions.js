import { AnalysisActions } from '@webapp/service/storage'
import * as AnalysisStorage from './storage'

// ====== chain
export const persistChain = ({ chain }) => {
  AnalysisStorage.setChain({ chain })
  window.dispatchEvent(new CustomEvent(AnalysisStorage.eventTypes.setChain))
}

export const getChain = () => AnalysisStorage.getChain()

export const resetChain = () => AnalysisStorage.removeChain()

// ===== step
export const persistStep = ({ step, stepDirty }) => {
  AnalysisStorage.setStep({ step, stepDirty })
  window.dispatchEvent(new CustomEvent(AnalysisStorage.eventTypes.setStep))
}

export const getStep = () => AnalysisStorage.getStep()

export const resetStep = () => AnalysisStorage.removeStep()

// ===== calculation
export const persistCalculation = ({ calculation, calculationDirty }) => {
  AnalysisStorage.setCalculation({ calculation, calculationDirty })
  window.dispatchEvent(new CustomEvent(AnalysisStorage.eventTypes.setCalculation))
}

export const getCalculation = () => AnalysisStorage.getCalculation()

export const resetCalculation = () => AnalysisStorage.removeCalculation()

// ==== Analysus
export const get = () => {
  const chain = AnalysisActions.getChain()
  const { step, stepDirty } = AnalysisActions.getStep()
  const { calculation, calculationDirty } = AnalysisActions.getCalculation()

  return { chain, step, stepDirty, calculation, calculationDirty }
}
export const resetAnalysis = () => {
  resetChain()
  resetStep()
  resetCalculation()
}

export const persist = (analysis) => {
  persistChain(analysis)
  persistStep(analysis)
  persistCalculation(analysis)
}
