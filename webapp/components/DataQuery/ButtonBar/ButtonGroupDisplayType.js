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
  const chartType = DataExplorerSelectors.useChartType()

  return (
    <FormItem className="display-type-form-item" label={i18n.t('dataView.dataQuery.displayType.label')}>
      <div>
        <ButtonGroup
          groupName="displayType"
          selectedItemKey={displayType}
          onChange={(type) => dispatch(DataExplorerActions.setDisplayType(type))}
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
        {displayType === DataExplorerState.displayTypes.chart && (
          <ButtonGroup
            groupName="chartType"
            selectedItemKey={chartType}
            onChange={(type) => dispatch(DataExplorerActions.setChartType(type))}
            items={[
              {
                key: DataExplorerState.chartTypes.bar,
                iconClassName: 'icon-stats-bars',
                title: 'dataView.dataQuery.chartType.bar',
              },
              {
                key: DataExplorerState.chartTypes.pie,
                iconClassName: 'icon-pie-chart',
                title: 'dataView.dataQuery.chartType.pie',
              },
            ]}
          />
        )}
      </div>
    </FormItem>
  )
}
