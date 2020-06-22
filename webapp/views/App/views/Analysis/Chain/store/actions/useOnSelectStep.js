import { AnalysisActions } from '@webapp/service/storage'

export const useOnSelectStep = ({ setStep }) => {
  return (step) => {
    setStep(step)
    AnalysisActions.persistStep({ step })
  }
}
