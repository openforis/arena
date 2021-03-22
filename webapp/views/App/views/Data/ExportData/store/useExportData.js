import { useState } from 'react'

import { useActions } from './actions'

export const useExportData = () => {
  const [exportDataUrl, setExportDataUrl] = useState(false)

  const { exportCsvData } = useActions({
    exportDataUrl,
    setExportDataUrl,
  })

  return {
    exportCsvData,
    exportDataUrl,
  }
}
