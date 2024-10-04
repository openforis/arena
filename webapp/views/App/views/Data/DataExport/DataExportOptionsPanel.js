import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { DateFormats, Objects } from '@openforis/arena-core'

import { ExpansionPanel } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { DateInput } from '@webapp/components/form/DateTimeInput'

import { useSurveyCycleKeys } from '@webapp/store/survey'
import { useAuthCanUseAnalysis, useUserIsSystemAdmin } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import { dataExportOptions } from './dataExportOptions'

const infoMessageKeyByOption = {
  expandCategoryItems: 'dataExportView.optionsInfo.expandCategoryItems',
}

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
      dataExportOptions.expandCategoryItems,
      dataExportOptions.includeCategories,
      dataExportOptions.includeAncestorAttributes,
      dataExportOptions.includeFiles,
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
          info={infoMessageKeyByOption[optionKey]}
          label={`dataExportView.options.${optionKey}`}
          onChange={onOptionChange(optionKey)}
        />
      ))}
      <FormItem label={i18n.t(`dataExportView.options.${dataExportOptions.recordsModifiedAfter}`)}>
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
