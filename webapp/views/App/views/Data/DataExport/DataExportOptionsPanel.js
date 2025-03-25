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

import { dataImportNonCompatibilityByOption, dataExportOptions as options } from './dataExportOptions'

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
    const _options = [
      options.includeCategoryItemsLabels,
      options.includeAncestorAttributes,
      options.includeFiles,
      options.includeFileAttributeDefs,
      options.includeDateCreated,
      options.includeCategories,
      options.expandCategoryItems,
      options.exportSingleEntitiesIntoSeparateFiles,
    ]
    if (canAnalyzeRecords) {
      _options.push(options.includeAnalysis)
    }
    if (hasMultipleCycles) {
      _options.push(options.includeDataFromAllCycles)
    }
    if (isSystemAdmin) {
      _options.push(options.includeInternalUuids)
    }
    return _options
  }, [availableOptionsProp, canAnalyzeRecords, hasMultipleCycles, isSystemAdmin])

  return (
    <ExpansionPanel className="data-export-expansion-panel" buttonLabel="dataExportView.options.header">
      <FormItem label={`dataExportView.options.${options.fileFormat}Label`}>
        <ButtonGroup
          groupName="fileFormat"
          items={availableFileFormats.map((key) => ({
            key,
            label: `dataExportView.options.fileFormat.${key}`,
          }))}
          onChange={onOptionChange(options.fileFormat)}
          selectedItemKey={selectedOptionsByKey[options.fileFormat]}
        />
      </FormItem>
      {availableOptions.map((optionKey) => (
        <Checkbox
          key={optionKey}
          checked={selectedOptionsByKey[optionKey]}
          className={dataImportNonCompatibilityByOption[optionKey] ? 'with-asterisk' : undefined}
          disabled={optionKey === options.includeFileAttributeDefs && selectedOptionsByKey[options.includeFiles]}
          info={infoMessageKeyByOption[optionKey]}
          label={`dataExportView.options.${optionKey}`}
          onChange={onOptionChange(optionKey)}
        />
      ))}
      <FormItem label={`dataExportView.options.${options.recordsModifiedAfter}`}>
        <DateInput
          onChange={onOptionChange(options.recordsModifiedAfter)}
          value={selectedOptionsByKey[options.recordsModifiedAfter]}
          valueFormat={DateFormats.dateStorage}
        />
      </FormItem>
      {availableOptions.some((optionKey) => dataImportNonCompatibilityByOption[optionKey]) && (
        <span className="not-compatible-with-data-import-message">
          *{i18n.t('dataExportView.optionNotCompatibleWithDataImport')}
        </span>
      )}
    </ExpansionPanel>
  )
}

DataExportOptionsPanel.propTypes = {
  availableOptions: PropTypes.array,
  onOptionChange: PropTypes.func.isRequired,
  selectedOptionsByKey: PropTypes.object.isRequired,
}
