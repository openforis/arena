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

  const [state, setState] = useState({ options: { includeCategoryItemsLabel: false } })
  const { options } = state

  const onIncludeCategoryLabelsChange = (value) =>
    setState((statePrev) => {
      const optionsUpdated = { ...statePrev.params, includeCategoryItemsLabel: value }
      return { ...statePrev, options: optionsUpdated }
    })

  return (
    <div className="export">
      <ExpansionPanel className="options" buttonLabel="dataExportView.options.header" startClosed>
        <FormItem className="check" label={i18n.t('dataExportView.options.includeCategoryItemsLabels')}>
          <Checkbox checked={options.includeCategoryItemsLabel} onChange={onIncludeCategoryLabelsChange} />
        </FormItem>
      </ExpansionPanel>

      <Button
        testId={TestId.dataExport.prepareExport}
        onClick={() => dispatch(ExportCsvDataActions.startCSVExport())}
        label="dataExportView.startCsvExport"
      />
    </div>
  )
}

export default ExportData
