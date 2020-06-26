import { AnalysisActions } from '@webapp/service/storage'

export const useSelect = ({ setCalculation }) => {
  return (calculation) => {
    setCalculation(calculation)
    AnalysisActions.persistCalculation({ calculation })
  }
}
