import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { DateFormats, Objects } from '@openforis/arena-core'

import { ExpansionPanel } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { DateInput } from '@webapp/components/form/DateTimeInput'

import { useSurveyCycleKeys } from '@webapp/store/survey'
import { useAuthCanUseAnalysis } from '@webapp/store/user'
import { useI18n } from '@webapp/store/system'

import { dataExportOptions } from './dataExportOptions'

const infoMessageKeyByOption = {
  expandCategoryItems: 'dataExportView.optionsInfo.expandCategoryItems',
}

export const DataExportOptionsPanel = (props) => {
  const { availableOptions: availableOptionsProp, onOptionChange, selectedOptionsByKey } = props

  const i18n = useI18n()
  const canAnalyzeRecords = useAuthCanUseAnalysis()
  const cycles = useSurveyCycleKeys()
  const hasMultipleCycles = cycles.length > 1

  const availableOptions = useMemo(
    () =>
      Objects.isEmpty(availableOptionsProp)
        ? [
            dataExportOptions.includeCategoryItemsLabels,
            dataExportOptions.expandCategoryItems,
            dataExportOptions.includeCategories,
            dataExportOptions.includeAncestorAttributes,
            ...(canAnalyzeRecords ? [dataExportOptions.includeAnalysis] : []),
            ...(hasMultipleCycles ? [dataExportOptions.includeDataFromAllCycles] : []),
            dataExportOptions.includeFiles,
          ]
        : availableOptionsProp,
    [availableOptionsProp, canAnalyzeRecords, hasMultipleCycles]
  )

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
