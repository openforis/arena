import { useExportCsvData } from './useExportCsvData'

export const useActions = ({ exportDataUrl, setExportDataUrl }) => ({
  exportCsvData: useExportCsvData({ exportDataUrl, setExportDataUrl }),
})
