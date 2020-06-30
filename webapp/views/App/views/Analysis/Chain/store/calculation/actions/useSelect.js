import { AnalysisActions } from '@webapp/service/storage'

export const useSelect = ({ setCalculation, setOriginalCalculation, setCalculationDirty }) => {
  return (calculation) => {
    setCalculation(calculation)
    setOriginalCalculation(calculation)
    AnalysisActions.persistCalculation({ calculation })
    setCalculationDirty(false)
  }
}
