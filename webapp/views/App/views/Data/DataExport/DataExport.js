import './DataExport.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { TestId } from '@webapp/utils/testId'

import { ExportCsvDataActions } from '@webapp/store/ui'
import { Button, RadioButtonGroup } from '@webapp/components'
import { FormItem } from '@webapp/components/form/Input'
import { useI18n } from '@webapp/store/system'
import { DataExportOptionsPanel } from './DataExportOptionsPanel'
import { defaultDataExportOptionsSelection } from './dataExportOptions'

const sources = {
  allRecords: 'allRecords',
  filteredRecords: 'filteredRecords',
  selectedRecords: 'selectedRecords',
}

const DataExport = (props) => {
  const { recordUuids, search, sourceSelectionAvailable } = props

  const dispatch = useDispatch()
  const i18n = useI18n()

  const [state, setState] = useState({
    selectedOptionsByKey: defaultDataExportOptionsSelection,
    source: sources.allRecords,
  })
  const { selectedOptionsByKey, source } = state

  const onOptionChange = (option) => (value) =>
    setState((statePrev) => {
      const optionsUpdated = { ...statePrev.selectedOptionsByKey, [option]: value }
      return { ...statePrev, selectedOptionsByKey: optionsUpdated }
    })

  const onSourceChange = (selectedSource) => setState((statePrev) => ({ ...statePrev, source: selectedSource }))

  const onExportClick = () =>
    dispatch(
      ExportCsvDataActions.startCSVExport({
        recordUuids: source === sources.selectedRecords ? recordUuids : null,
        search: source === sources.filteredRecords ? search : null,
        options: selectedOptionsByKey,
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

      <DataExportOptionsPanel onOptionChange={onOptionChange} selectedOptionsByKey={selectedOptionsByKey} />

      <Button
        className="btn-primary"
        label="dataExportView.startExport"
        onClick={onExportClick}
        testId={TestId.dataExport.prepareExport}
      />
    </div>
  )
}

DataExport.propTypes = {
  recordUuids: PropTypes.array,
  search: PropTypes.string,
  sourceSelectionAvailable: PropTypes.bool,
}

DataExport.defaultProps = {
  sourceSelectionAvailable: false,
}

export default DataExport
