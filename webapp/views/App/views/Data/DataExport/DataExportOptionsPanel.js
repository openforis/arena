import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { DateFormats, Objects } from '@openforis/arena-core'

import { FileFormats } from '@core/fileFormats'

import { ExpansionPanel } from '@webapp/components'
import { ButtonGroup, Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { DateInput } from '@webapp/components/form/DateTimeInput'

import { useI18n } from '@webapp/store/system'
import { useSurveyCycleKeys } from '@webapp/store/survey'
import { useAuthCanUseAnalysis, useUserIsSystemAdmin } from '@webapp/store/user'

import { dataExportOptions } from './dataExportOptions'

const infoMessageKeyByOption = {
  expandCategoryItems: 'dataExportView.optionsInfo.expandCategoryItems',
}

const availableFileFormats = [FileFormats.xlsx, FileFormats.csv]

export const DataExportOptionsPanel = (props) => {
  const { availableOptions: availableOptionsProp, onOptionChange, selectedOptionsByKey } = props

  const i18n = useI18n()
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
      dataExportOptions.includeAncestorAttributes,
      dataExportOptions.includeFiles,
      dataExportOptions.includeFileAttributeDefs,
      dataExportOptions.includeDateCreated,
      dataExportOptions.includeCategories,
      dataExportOptions.expandCategoryItems,
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
      <FormItem label={`dataExportView.options.${dataExportOptions.fileFormat}Label`}>
        <ButtonGroup
          groupName="fileFormat"
          items={availableFileFormats.map((key) => ({
            key,
            label: i18n.t(`dataExportView.options.fileFormat.${key}`),
          }))}
          onChange={onOptionChange(dataExportOptions.fileFormat)}
          selectedItemKey={selectedOptionsByKey[dataExportOptions.fileFormat]}
        />
      </FormItem>
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
