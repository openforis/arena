import { useSelector } from 'react-redux'
import * as ExportCsvDataState from './state'

export const useExportCsvDataUrl = () => useSelector(ExportCsvDataState.geExportCsvDataUrl)
