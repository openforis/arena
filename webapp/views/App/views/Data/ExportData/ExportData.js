import './ExportData.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

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
  expandCategoryItems: 'Expand category items (add one boolean column for every category item)',
  includeCategories: 'includeCategories',
  includeAnalysis: 'includeAnalysis',
  includeDataFromAllCycles: 'includeDataFromAllCycles',
  includeFiles: 'includeFiles',
}

const defaultOptionsSelection = {
  [exportOptions.includeCategoryItemsLabels]: true,
  [exportOptions.expandCategoryItems]: false,
  [exportOptions.includeCategories]: false,
  [exportOptions.includeAnalysis]: false,
  [exportOptions.includeDataFromAllCycles]: false,
  [exportOptions.includeFiles]: false,
}

const sources = {
  allRecords: 'allRecords',
  filteredRecords: 'filteredRecords',
  selectedRecords: 'selectedRecords',
}

const ExportData = (props) => {
  const { recordUuids, search, sourceSelectionAvailable } = props

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
        search: source === sources.filteredRecords ? search : null,
        options: selectedOptions,
      })
    )

  const availableSources = [
    {
      key: sources.allRecords,
      label: `dataView.dataExport.source.allRecords`,
    },
  ]
  if (sourceSelectionAvailable && recordUuids.length > 0) {
    availableSources.push({
      key: sources.selectedRecords,
      label: `dataView.dataExport.source.selectedRecord`,
      labelParams: { count: recordUuids.length },
    })
  }
  if (sourceSelectionAvailable && !Objects.isEmpty(search)) {
    availableSources.push({
      key: sources.filteredRecords,
      label: `dataView.dataExport.source.filteredRecords`,
    })
  }

  return (
    <div className="export">
      {availableSources.length > 1 && (
        <FormItem className="source-form-item" label={i18n.t('dataView.dataExport.source.label')}>
          <RadioButtonGroup onChange={onSourceChange} value={source} items={availableSources} />
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

      <Button
        className="btn-primary"
        label="dataExportView.startExport"
        onClick={onExportClick}
        testId={TestId.dataExport.prepareExport}
      />
    </div>
  )
}

ExportData.propTypes = {
  recordUuids: PropTypes.array,
  search: PropTypes.string,
  sourceSelectionAvailable: PropTypes.bool,
}

ExportData.defaultProps = {
  sourceSelectionAvailable: false,
}

export default ExportData
