import './ExportData.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { TestId } from '@webapp/utils/testId'

import { ExportCsvDataActions } from '@webapp/store/ui'
import { Button, ExpansionPanel, RadioButtonGroup } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'
import { useAuthCanUseAnalysis } from '@webapp/store/user'
import { useSurveyCycleKeys } from '@webapp/store/survey'
import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'

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

const sources = {
  allRecords: 'allRecords',
  selectedRecords: 'selectedRecords',
}

const ExportData = (props) => {
  const { sourceSelectionAvailable, recordUuids } = props

  const dispatch = useDispatch()
  const i18n = useI18n()
  const canAnalyzeRecords = useAuthCanUseAnalysis()
  const cycles = useSurveyCycleKeys()

  const [state, setState] = useState({ selectedOptions: defaultOptionsSelection, source: sources.allRecords })
  const { selectedOptions, source } = state

  const onOptionChange = (option) => (value) =>
    setState((statePrev) => {
      const optionsUpdated = { ...statePrev.selectedOptions, [option]: value }
      return { ...statePrev, selectedOptions: optionsUpdated }
    })

  const onSourceChange = (selectedSource) => setState((statePrev) => ({ ...statePrev, source: selectedSource }))

  const onExportClick = () =>
    dispatch(
      ExportCsvDataActions.startCSVExport({
        recordUuids: source === sources.selectedRecords ? recordUuids : null,
        options: selectedOptions,
      })
    )

  return (
    <div className="export">
      {sourceSelectionAvailable && recordUuids.length > 0 && (
        <FormItem className="source-form-item" label={i18n.t('dataView.dataExport.source.label')}>
          <RadioButtonGroup
            onChange={onSourceChange}
            value={source}
            items={[
              {
                key: sources.allRecords,
                label: `dataView.dataExport.source.allRecords`,
              },
              {
                key: sources.selectedRecords,
                label: `dataView.dataExport.source.selectedRecord`,
                labelParams: { count: recordUuids.length },
                disabled: recordUuids.length === 0,
              },
            ]}
          />
        </FormItem>
      )}
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

      <Button testId={TestId.dataExport.prepareExport} onClick={onExportClick} label="dataExportView.startExport" />
    </div>
  )
}

ExportData.propTypes = {
  recordUuids: PropTypes.array,
  sourceSelectionAvailable: PropTypes.bool,
}

ExportData.defaultProps = {
  sourceSelectionAvailable: false,
}

export default ExportData
