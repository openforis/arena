import './DataExport.scss'

import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import classNames from 'classnames'
import PropTypes from 'prop-types'

import { TestId } from '@webapp/utils/testId'

import { RecordListActions } from '@webapp/store/ui'
import { Button, RadioButtonGroup } from '@webapp/components'
import { FormItem } from '@webapp/components/form/Input'
import { DataExportOptionsPanel } from './DataExportOptionsPanel'
import { dataExportOptions, defaultDataExportOptionsSelection } from './dataExportOptions'
import { useDataExportSource } from './useDataExportSource'

const DataExport = (props) => {
  const { recordUuids = null, search = null, sourceSelectionAvailable = false } = props

  const dispatch = useDispatch()

  const { availableSources, multipleSources, onSourceChange, source, sourceParams } = useDataExportSource({
    recordUuids,
    search,
    sourceSelectionAvailable,
  })

  const [selectedOptionsByKey, setSelectedOptionsByKey] = useState(defaultDataExportOptionsSelection)

  const onOptionChange = (option) => (value) =>
    setSelectedOptionsByKey((optionsPrev) => {
      const optionsUpdated = { ...optionsPrev, [option]: value }
      if (option === dataExportOptions.includeFiles) {
        optionsUpdated[dataExportOptions.includeFileAttributeDefs] = value
      }
      return optionsUpdated
    })

  const onExportClick = () =>
    dispatch(RecordListActions.startCSVExport({ ...sourceParams, options: selectedOptionsByKey }))

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

DataExport.propTypes = {
  recordUuids: PropTypes.array,
  search: PropTypes.string,
  sourceSelectionAvailable: PropTypes.bool,
}

export default DataExport
