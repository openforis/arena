import './DataExport.scss'

import { useMemo, useState } from 'react'
import classNames from 'classnames'

import { Objects } from '@openforis/arena-core'

import { Button, RadioButtonGroup } from '@webapp/components'
import { FormItem } from '@webapp/components/form/Input'
import { useAppDispatch } from '@webapp/store'
import { RecordListActions } from '@webapp/store/ui'
import { TestId } from '@webapp/utils/testId'

import { dataExportOptions, defaultDataExportOptionsSelection } from './dataExportOptions'
import { DataExportOptionsPanel } from './DataExportOptionsPanel'

const sources = {
  allRecords: 'allRecords',
  filteredRecords: 'filteredRecords',
  selectedRecords: 'selectedRecords',
}

type DataExportProps = {
  recordUuids?: any[]
  search?: string
  sourceSelectionAvailable?: boolean
}

const DataExport = (props: DataExportProps) => {
  const { recordUuids = null, search = null, sourceSelectionAvailable = false } = props

  const selectedRecordsCount = recordUuids?.length ?? 0

  const dispatch = useAppDispatch()

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
      RecordListActions.startCSVExport({
        recordUuids: source === sources.selectedRecords ? recordUuids : null,
        search: source === sources.filteredRecords ? search : null,
        options: selectedOptionsByKey,
      })
    )

  const availableSources = useMemo(() => {
    const _availableSources: { key: string; label: string; labelParams?: Record<string, unknown> }[] = [
      {
        key: sources.allRecords,
        label: `dataView:dataExport.source.allRecords`,
      },
    ]
    if (sourceSelectionAvailable && selectedRecordsCount > 0) {
      _availableSources.push({
        key: sources.selectedRecords,
        label: `dataView:dataExport.source.selectedRecord`,
        labelParams: { count: selectedRecordsCount },
      })
    }
    if (sourceSelectionAvailable && !Objects.isEmpty(search)) {
      _availableSources.push({
        key: sources.filteredRecords,
        label: `dataView:dataExport.source.filteredRecords`,
      })
    }
    return _availableSources
  }, [search, selectedRecordsCount, sourceSelectionAvailable])

  const multipleSources = availableSources.length > 1

  return (
    <div className={classNames('data-export-container', { 'with-multiple-sources': multipleSources })}>
      {multipleSources && (
        <FormItem className="source-form-item" label="dataView:dataExport.source.label">
          <RadioButtonGroup onChange={onSourceChange} value={source} items={availableSources} />
        </FormItem>
      )}

      <DataExportOptionsPanel onOptionChange={onOptionChange} selectedOptionsByKey={selectedOptionsByKey} />

      <Button
        className="btn-primary"
        label="dataExportView:startExport"
        onClick={onExportClick}
        testId={TestId.dataExport.startExport}
      />
    </div>
  )
}

export default DataExport
