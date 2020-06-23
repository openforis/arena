import { AnalysisActions } from '@webapp/service/storage'

export const useSelect = ({ setStep }) => {
  return (step) => {
    setStep(step)
    AnalysisActions.persistStep({ step })
  }
}
