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

const exportOptions = {
  includeCategoryItemsLabels: 'includeCategoryItemsLabels',
  includeCategories: 'includeCategories',
  includeAnalysis: 'includeAnalysis',
  includeDataFromAllCycles: 'includeDataFromAllCycles',
  includeFiles: 'includeFiles',
}
const ExportData = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const canAnalyzeRecords = useAuthCanUseAnalysis()
  const cycles = useSurveyCycleKeys()

  const [state, setState] = useState({
    options: {
      [exportOptions.includeCategoryItemsLabels]: true,
      [exportOptions.includeCategories]: false,
      [exportOptions.includeAnalysis]: false,
      [exportOptions.includeDataFromAllCycles]: false,
      [exportOptions.includeFiles]: false,
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
        {[
          exportOptions.includeCategoryItemsLabels,
          exportOptions.includeCategories,
          ...(canAnalyzeRecords ? [exportOptions.includeAnalysis] : []),
          ...(cycles.length > 1 ? [exportOptions.includeDataFromAllCycles] : []),
          exportOptions.includeFiles,
        ].map((optionKey) => (
          <Checkbox
            key={optionKey}
            checked={options[optionKey]}
            label={i18n.t(`dataExportView.options.${optionKey}`)}
            onChange={onOptionChange(optionKey)}
          />
        ))}
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
