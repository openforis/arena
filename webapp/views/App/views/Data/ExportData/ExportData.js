import './ExportData.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'

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

const defaultOptionsSelection = {
  [exportOptions.includeCategoryItemsLabels]: true,
  [exportOptions.includeCategories]: false,
  [exportOptions.includeAnalysis]: false,
  [exportOptions.includeDataFromAllCycles]: false,
  [exportOptions.includeFiles]: false,
}

const ExportData = () => {
  const dispatch = useDispatch()
  const canAnalyzeRecords = useAuthCanUseAnalysis()
  const cycles = useSurveyCycleKeys()

  const [state, setState] = useState({ selectedOptions: defaultOptionsSelection })
  const { selectedOptions } = state

  const onOptionChange = (option) => (value) =>
    setState((statePrev) => {
      const optionsUpdated = { ...statePrev.selectedOptions, [option]: value }
      return { ...statePrev, selectedOptions: optionsUpdated }
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
            checked={selectedOptions[optionKey]}
            label={`dataExportView.options.${optionKey}`}
            onChange={onOptionChange(optionKey)}
          />
        ))}
      </ExpansionPanel>

      <Button
        testId={TestId.dataExport.prepareExport}
        onClick={() => dispatch(ExportCsvDataActions.startCSVExport(selectedOptions))}
        label="dataExportView.startExport"
      />
    </div>
  )
}

export default ExportData
