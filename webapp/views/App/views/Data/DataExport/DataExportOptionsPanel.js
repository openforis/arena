import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { DateFormats, Objects } from '@openforis/arena-core'

import { ExpansionPanel } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { DateInput } from '@webapp/components/form/DateTimeInput'

import { useSurveyCycleKeys } from '@webapp/store/survey'
import { useAuthCanUseAnalysis, useUserIsSystemAdmin } from '@webapp/store/user'

import { dataExportOptions } from './dataExportOptions'

const infoMessageKeyByOption = {
  expandCategoryItems: 'dataExportView.optionsInfo.expandCategoryItems',
}

export const DataExportOptionsPanel = (props) => {
  const { availableOptions: availableOptionsProp, onOptionChange, selectedOptionsByKey } = props

  const isSystemAdmin = useUserIsSystemAdmin()
  const canAnalyzeRecords = useAuthCanUseAnalysis()
  const cycles = useSurveyCycleKeys()
  const hasMultipleCycles = cycles.length > 1

  const availableOptions = useMemo(() => {
    if (Objects.isNotEmpty(availableOptionsProp)) {
      return availableOptionsProp
    }
    const options = [
      dataExportOptions.includeCategoryItemsLabels,
      dataExportOptions.expandCategoryItems,
      dataExportOptions.includeCategories,
      dataExportOptions.includeAncestorAttributes,
      dataExportOptions.includeFiles,
      dataExportOptions.includeFileAttributeDefs,
    ]
    if (canAnalyzeRecords) {
      options.push(dataExportOptions.includeAnalysis)
    }
    if (hasMultipleCycles) {
      options.push(dataExportOptions.includeDataFromAllCycles)
    }
    if (isSystemAdmin) {
      options.push(dataExportOptions.includeInternalUuids)
    }
    return options
  }, [availableOptionsProp, canAnalyzeRecords, hasMultipleCycles, isSystemAdmin])

  return (
    <ExpansionPanel className="options" buttonLabel="dataExportView.options.header">
      {availableOptions.map((optionKey) => (
        <Checkbox
          key={optionKey}
          checked={selectedOptionsByKey[optionKey]}
          disabled={
            optionKey === dataExportOptions.includeFileAttributeDefs &&
            selectedOptionsByKey[dataExportOptions.includeFiles]
          }
          info={infoMessageKeyByOption[optionKey]}
          label={`dataExportView.options.${optionKey}`}
          onChange={onOptionChange(optionKey)}
        />
      ))}
      <FormItem label={`dataExportView.options.${dataExportOptions.recordsModifiedAfter}`}>
        <DateInput
          onChange={onOptionChange(dataExportOptions.recordsModifiedAfter)}
          value={selectedOptionsByKey[dataExportOptions.recordsModifiedAfter]}
          valueFormat={DateFormats.dateStorage}
        />
      </FormItem>
    </ExpansionPanel>
  )
}

DataExportOptionsPanel.propTypes = {
  availableOptions: PropTypes.array,
  onOptionChange: PropTypes.func.isRequired,
  selectedOptionsByKey: PropTypes.object.isRequired,
}
