import React, { useMemo } from 'react'
import PropTypes from 'prop-types'

import { ExpansionPanel } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'

import { useSurveyCycleKeys } from '@webapp/store/survey'
import { useAuthCanUseAnalysis } from '@webapp/store/user'

import { dataExportOptions } from './dataExportOptions'

const infoMessageKeyByOption = {
  expandCategoryItems: 'dataExportView.optionsInfo.expandCategoryItems',
}

export const DataExportOptionsPanel = (props) => {
  const { onOptionChange, selectedOptionsByKey } = props

  const canAnalyzeRecords = useAuthCanUseAnalysis()
  const cycles = useSurveyCycleKeys()
  const hasMultipleCycles = cycles.length > 1

  const availableOptions = useMemo(
    () => [
      dataExportOptions.includeCategoryItemsLabels,
      dataExportOptions.expandCategoryItems,
      dataExportOptions.includeCategories,
      dataExportOptions.includeAncestorAttributes,
      ...(canAnalyzeRecords ? [dataExportOptions.includeAnalysis] : []),
      ...(hasMultipleCycles ? [dataExportOptions.includeDataFromAllCycles] : []),
      dataExportOptions.includeFiles,
    ],
    [canAnalyzeRecords, hasMultipleCycles]
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
    </ExpansionPanel>
  )
}

DataExportOptionsPanel.propTypes = {
  onOptionChange: PropTypes.func.isRequired,
  selectedOptionsByKey: PropTypes.object.isRequired,
}
