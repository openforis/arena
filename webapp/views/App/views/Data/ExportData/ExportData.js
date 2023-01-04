import './ExportData.scss'

import React, { useState } from 'react'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { ExportCsvDataActions } from '@webapp/store/ui'
import { useDispatch } from 'react-redux'
import { Button, ExpansionPanel } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'
import { useAuthCanUseAnalysis } from '@webapp/store/user'

const ExportData = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const canAnalyzeRecords = useAuthCanUseAnalysis()

  const [state, setState] = useState({
    options: { includeCategoryItemsLabels: true, includeCategories: false, includeAnalysis: false },
  })
  const { options } = state

  const onOptionChange = (option) => (value) =>
    setState((statePrev) => {
      const optionsUpdated = { ...statePrev.options, [option]: value }
      return { ...statePrev, options: optionsUpdated }
    })

  return (
    <div className="export">
      <ExpansionPanel className="options" buttonLabel="dataExportView.options.header" startClosed>
        <FormItem className="check" label={i18n.t('dataExportView.options.includeCategoryItemsLabels')}>
          <Checkbox
            checked={options.includeCategoryItemsLabels}
            onChange={onOptionChange('includeCategoryItemsLabels')}
          />
        </FormItem>
        <FormItem className="check" label={i18n.t('dataExportView.options.includeCategories')}>
          <Checkbox checked={options.includeCategories} onChange={onOptionChange('includeCategories')} />
        </FormItem>
        {canAnalyzeRecords && (
          <FormItem className="check" label={i18n.t('dataExportView.options.includeResultVariables')}>
            <Checkbox checked={options.includeAnalysis} onChange={onOptionChange('includeAnalysis')} />
          </FormItem>
        )}
      </ExpansionPanel>

      <Button
        testId={TestId.dataExport.prepareExport}
        onClick={() => dispatch(ExportCsvDataActions.startCSVExport(options))}
        label="dataExportView.startCsvExport"
      />
    </div>
  )
}

export default ExportData
