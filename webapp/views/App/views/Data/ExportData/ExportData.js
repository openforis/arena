import './ExportData.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { ExportCsvDataActions } from '@webapp/store/ui'
import { Button, ExpansionPanel } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'
import { useAuthCanUseAnalysis } from '@webapp/store/user'
import { useSurveyCycleKeys } from '@webapp/store/survey'

const ExportData = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const canAnalyzeRecords = useAuthCanUseAnalysis()
  const cycles = useSurveyCycleKeys()

  const [state, setState] = useState({
    options: {
      includeCategoryItemsLabels: true,
      includeCategories: false,
      includeAnalysis: false,
      includeDataFromAllCycles: false,
    },
  })
  const { options } = state

  const onOptionChange = (option) => (value) =>
    setState((statePrev) => {
      const optionsUpdated = { ...statePrev.options, [option]: value }
      return { ...statePrev, options: optionsUpdated }
    })

  return (
    <div className="export">
      <ExpansionPanel className="options" buttonLabel="dataExportView.options.header">
        <Checkbox
          checked={options.includeCategoryItemsLabels}
          label={i18n.t('dataExportView.options.includeCategoryItemsLabels')}
          onChange={onOptionChange('includeCategoryItemsLabels')}
        />
        <Checkbox
          checked={options.includeCategories}
          label={i18n.t('dataExportView.options.includeCategories')}
          onChange={onOptionChange('includeCategories')}
        />
        {canAnalyzeRecords && (
          <Checkbox
            checked={options.includeAnalysis}
            label={i18n.t('dataExportView.options.includeResultVariables')}
            onChange={onOptionChange('includeAnalysis')}
          />
        )}
        {cycles.length > 1 && (
          <Checkbox
            checked={options.includeDataFromAllCycles}
            label={i18n.t('dataExportView.options.includeDataFromAllCycles')}
            onChange={onOptionChange('includeDataFromAllCycles')}
          />
        )}
      </ExpansionPanel>

      <Button
        testId={TestId.dataExport.prepareExport}
        onClick={() => dispatch(ExportCsvDataActions.startCSVExport(options))}
        label="dataExportView.startCsvExport"
      />
    </div>
  )
}

export default ExportData
