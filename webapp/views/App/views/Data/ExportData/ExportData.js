import './ExportData.scss'

import React, { useState } from 'react'

import { useI18n } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { ExportCsvDataActions } from '@webapp/store/ui'
import { useDispatch } from 'react-redux'
import { Button, ExpansionPanel } from '@webapp/components'
import { Checkbox } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

const ExportData = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()

  const [state, setState] = useState({ options: { includeCategoryItemsLabels: true, includeCategories: false } })
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
