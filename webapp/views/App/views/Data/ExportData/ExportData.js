import './ExportData.scss'

import React, { useEffect } from 'react'

import { useI18n } from '@webapp/store/system'
import DownloadButton from '@webapp/components/form/downloadButton'
import { useSurveyId } from '@webapp/store/survey'
import { DataTestId } from '@webapp/utils/dataTestId'

import { ExportCsvDataActions, useExportCsvDataUrl } from '@webapp/store/ui'
import { useDispatch } from 'react-redux'

const ExportData = () => {
  const i18n = useI18n()
  const surveyId = useSurveyId()
  const exportDataUrl = useExportCsvDataUrl()
  const dispatch = useDispatch()

  useEffect(() => {
    return () => {
      dispatch(ExportCsvDataActions.updateExportCsvDataUrl(false))
    }
  }, [])

  return (
    <div className="export">
      {!exportDataUrl ? (
        <button
          data-testid={DataTestId.dataExport.prepareExport}
          type="button"
          className="btn"
          onClick={() => dispatch(ExportCsvDataActions.startCSVExport())}
        >
          {i18n.t('dataExportView.startCsvExport')}
        </button>
      ) : (
        <DownloadButton
          id={DataTestId.dataExport.exportCSV}
          className="btn-transparent"
          href={`/api/survey/${surveyId}/export-csv-data/${exportDataUrl}`}
          label={`${i18n.t('common.export')} - ${exportDataUrl}`}
        />
      )}
    </div>
  )
}

export default ExportData
