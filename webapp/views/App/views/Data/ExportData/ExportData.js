import './ExportData.scss'

import React from 'react'

import { useI18n } from '@webapp/store/system'
import { useExportData } from '@webapp/views/App/views/Data/ExportData/store'
import DownloadButton from '@webapp/components/form/downloadButton'
import { useSurveyId } from '@webapp/store/survey'

const ExportData = () => {
  const i18n = useI18n()
  const surveyId = useSurveyId()

  const { exportCsvData, exportDataUrl } = useExportData()
  return (
    <div className="export">
      {!exportDataUrl ? (
        <button type="button" className="btn" onClick={exportCsvData}>
          {i18n.t('dataExportView.startCsvExport')}
        </button>
      ) : (
        <DownloadButton
          className="btn-transparent"
          href={`/api/survey/${surveyId}/export-csv-data/${exportDataUrl}`}
          label={`${i18n.t('common.export')} - ${exportDataUrl}`}
        />
      )}
    </div>
  )
}

export default ExportData
