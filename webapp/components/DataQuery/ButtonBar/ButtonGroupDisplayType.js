import React, { useCallback, useEffect, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { Query } from '@common/model/query'

import { ButtonGroup } from '@webapp/components/form'
import { DataExplorerActions, DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'

const { displayTypes, chartTypes, isChartTypeAvailable } = DataExplorerState

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

const chartMaxItems = 5000
const tableDefaultLimit = 15

const getQueryLimit = ({ displayType, chartType }) => {
  if (displayType !== displayTypes.chart) return tableDefaultLimit
  // scatter chart (raw mode) fetches a bounded random sample of rows (outliers always included);
  // aggregate charts fetch all the aggregated rows
  return chartType === chartTypes.scatter ? chartMaxItems : null
}

export const ButtonGroupDisplayType = (props) => {
  const { setQueryLimit, setQueryOffset } = props
  const dispatch = useDispatch()
  const displayType = DataExplorerSelectors.useDisplayType()
  const chartType = DataExplorerSelectors.useChartType()
  const query = DataExplorerSelectors.useQuery()
  const queryMode = Query.getMode(query)

  const chartTypeItems = useMemo(() => {
    const availableTypes = Object.keys(chartTypes).filter(isChartTypeAvailable({ queryMode }))
    return availableTypes.map(getChartTypeItemByKey)
  }, [queryMode])

  // display or chart type can change also when changing the query mode or resetting the entity
  useEffect(() => {
    setQueryLimit(getQueryLimit({ displayType, chartType }))
  }, [chartType, displayType, setQueryLimit])

  const onDisplayTypeChange = useCallback(
    (type) => {
      dispatch(DataExplorerActions.setDisplayType(type))
      setQueryOffset(0)
    },
    [dispatch, setQueryOffset]
  )

  return (
    <div className="display-type-button-group-wrapper">
      <ButtonGroup
        groupName="displayType"
        selectedItemKey={displayType}
        onChange={onDisplayTypeChange}
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
  setQueryLimit: PropTypes.func.isRequired,
  setQueryOffset: PropTypes.func.isRequired,
}
