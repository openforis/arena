import './ExportData.scss'

import React from 'react'

import { useI18n } from '@webapp/store/system'
import { DataTestId } from '@webapp/utils/dataTestId'

import { ExportCsvDataActions } from '@webapp/store/ui'
import { useDispatch } from 'react-redux'
import { Button } from '@webapp/components'

const ExportData = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()

  return (
    <div className="export">
      <Button
        testId={DataTestId.dataExport.prepareExport}
        onClick={() => dispatch(ExportCsvDataActions.startCSVExport())}
        label={i18n.t('dataExportView.startCsvExport')}
      />
    </div>
  )
}

export default ExportData
