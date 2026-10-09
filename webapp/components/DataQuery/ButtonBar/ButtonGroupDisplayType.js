import React, { useMemo } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { Query } from '@common/model/query'

import { ButtonGroup } from '@webapp/components/form'
import { DataExplorerActions, DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'
import { NotificationActions } from '@webapp/store/ui'

const { displayTypes, chartTypes, chartMaxItems, isChartTypeAvailable } = DataExplorerState

const iconByDisplayType = {
  [displayTypes.chart]: 'icon-pie-chart',
  [displayTypes.table]: 'icon-table2',
}

const displayTypeItems = Object.keys(displayTypes).map((displayType) => ({
  key: displayType,
  iconClassName: iconByDisplayType[displayType],
  label: `dataView:dataQuery.displayType.${displayType}`,
}))

const iconByChartType = {
  [chartTypes.area]: 'icon-stats-dots',
  [chartTypes.bar]: 'icon-stats-bars',
  [chartTypes.line]: 'icon-stats-bars2',
  [chartTypes.pie]: 'icon-pie-chart',
  [chartTypes.scatter]: 'icon-stats-dots',
}

const getChartTypeItemByKey = (chartType) => ({
  key: chartType,
  iconClassName: iconByChartType[chartType],
  title: `dataView:charts.type.${chartType}`,
})

export const ButtonGroupDisplayType = (props) => {
  const { dataCount } = props
  const dispatch = useDispatch()
  const displayType = DataExplorerSelectors.useDisplayType()
  const chartType = DataExplorerSelectors.useChartType()
  const query = DataExplorerSelectors.useQuery()
  const queryMode = Query.getMode(query)

  const chartTypeItems = useMemo(() => {
    const availableTypes = Object.keys(chartTypes).filter(isChartTypeAvailable({ queryMode }))
    return availableTypes.map(getChartTypeItemByKey)
  }, [queryMode])

  return (
    <div className="display-type-button-group-wrapper">
      <ButtonGroup
        groupName="displayType"
        selectedItemKey={displayType}
        onChange={(type) => {
          if (type === displayTypes.chart && dataCount > chartMaxItems) {
            dispatch(
              NotificationActions.showNotification({
                key: 'dataView:charts.warning.tooManyItemsToShowChart',
                params: { maxItems: chartMaxItems },
              })
            )
            return
          }
          dispatch(DataExplorerActions.setDisplayType(type))
        }}
        items={displayTypeItems}
      />
      {displayType === displayTypes.chart && (
        <ButtonGroup
          groupName="chartType"
          selectedItemKey={chartType}
          onChange={(type) => dispatch(DataExplorerActions.setChartType(type))}
          items={chartTypeItems}
        />
      )}
    </div>
  )
}

ButtonGroupDisplayType.propTypes = {
  dataCount: PropTypes.number,
}
