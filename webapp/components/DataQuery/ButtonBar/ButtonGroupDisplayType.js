import React from 'react'
import { useDispatch } from 'react-redux'

import { ButtonGroup } from '@webapp/components/form'
import { FormItem } from '@webapp/components/form/Input'

import { DataExplorerActions, DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'
import { useI18n } from '@webapp/store/system'

export const ButtonGroupDisplayType = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const displayType = DataExplorerSelectors.useDisplayType()

  return (
    <FormItem className="display-type-form-item" label={i18n.t('dataView.dataQuery.displayType.label')}>
      <ButtonGroup
        groupName="displayType"
        selectedItemKey={displayType}
        onChange={(displayTypeUpdated) => dispatch(DataExplorerActions.setDisplayType(displayTypeUpdated))}
        items={[
          {
            key: DataExplorerState.displayTypes.table,
            iconClassName: 'icon-table2',
            label: 'dataView.dataQuery.displayType.table',
          },
          {
            key: DataExplorerState.displayTypes.chart,
            iconClassName: 'icon-pie-chart',
            label: 'dataView.dataQuery.displayType.chart',
          },
        ]}
      />
    </FormItem>
  )
}
