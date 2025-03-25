import './DataExport.scss'

import React, { useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { Objects } from '@openforis/arena-core'

import { TestId } from '@webapp/utils/testId'

import { ExportCsvDataActions } from '@webapp/store/ui'
import { Button, RadioButtonGroup } from '@webapp/components'
import { FormItem } from '@webapp/components/form/Input'
import { DataExportOptionsPanel } from './DataExportOptionsPanel'
import { dataExportOptions, defaultDataExportOptionsSelection } from './dataExportOptions'

const sources = {
  allRecords: 'allRecords',
  filteredRecords: 'filteredRecords',
  selectedRecords: 'selectedRecords',
}

const DataExport = (props) => {
  const { recordUuids = null, search = null, sourceSelectionAvailable = false } = props

  const selectedRecordsCount = recordUuids?.length ?? 0

  const dispatch = useDispatch()

  const [state, setState] = useState({
    selectedOptionsByKey: defaultDataExportOptionsSelection,
    source: sources.allRecords,
  })
  const { selectedOptionsByKey, source } = state

  const onOptionChange = (option) => (value) =>
    setState((statePrev) => {
      const optionsUpdated = { ...statePrev.selectedOptionsByKey, [option]: value }
      if (option === dataExportOptions.includeFiles) {
        optionsUpdated[dataExportOptions.includeFileAttributeDefs] = value
      }
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

  const availableSources = useMemo(() => {
    const _availableSources = [
      {
        key: sources.allRecords,
        label: `dataView.dataExport.source.allRecords`,
      },
    ]
    if (sourceSelectionAvailable && selectedRecordsCount > 0) {
      _availableSources.push({
        key: sources.selectedRecords,
        label: `dataView.dataExport.source.selectedRecord`,
        labelParams: { count: selectedRecordsCount },
      })
    }
    if (sourceSelectionAvailable && !Objects.isEmpty(search)) {
      _availableSources.push({
        key: sources.filteredRecords,
        label: `dataView.dataExport.source.filteredRecords`,
      })
    }
    return _availableSources
  }, [search, selectedRecordsCount, sourceSelectionAvailable])

  const multipleSources = availableSources.length > 1

  return (
    <div className={classNames('data-export-container', { 'with-multiple-sources': multipleSources })}>
      {multipleSources && (
        <FormItem className="source-form-item" label="dataView.dataExport.source.label">
          <RadioButtonGroup onChange={onSourceChange} value={source} items={availableSources} />
        </FormItem>
      )}

      <DataExportOptionsPanel onOptionChange={onOptionChange} selectedOptionsByKey={selectedOptionsByKey} />

      <Button
        className="btn-primary"
        label="dataExportView.startExport"
        onClick={onExportClick}
        testId={TestId.dataExport.startExport}
      />
    </div>
  )
}

DataExport.propTypes = {
  recordUuids: PropTypes.array,
  search: PropTypes.string,
  sourceSelectionAvailable: PropTypes.bool,
}

export default DataExport
