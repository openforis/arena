import React from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import { ButtonGroup } from '@webapp/components/form'

import { DataExplorerActions, DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'

const { displayTypes, chartTypes } = DataExplorerState

const iconByDisplayType = {
  [displayTypes.chart]: 'icon-pie-chart',
  [displayTypes.table]: 'icon-table2',
}

const displayTypeItems = Object.keys(displayTypes).map((displayType) => ({
  key: displayType,
  iconClassName: iconByDisplayType[displayType],
  label: `dataView.dataQuery.displayType.${displayType}`,
}))

const iconByChartType = {
  [chartTypes.bar]: 'icon-stats-bars',
  [chartTypes.pie]: 'icon-pie-chart',
}

const chartTypeItems = Object.keys(chartTypes).map((chartType) => ({
  key: chartType,
  iconClassName: iconByChartType[chartType],
  title: `dataView.charts.type.${chartType}`,
}))

export const ButtonGroupDisplayType = (props) => {
  const { setQueryLimit, setQueryOffset } = props
  const dispatch = useDispatch()
  const displayType = DataExplorerSelectors.useDisplayType()
  const chartType = DataExplorerSelectors.useChartType()

  return (
    <div className="display-type-button-group-wrapper">
      <ButtonGroup
        groupName="displayType"
        selectedItemKey={displayType}
        onChange={(type) => {
          dispatch(DataExplorerActions.setDisplayType(type))
          setQueryOffset(0)
          const limitUpdated = type === displayTypes.chart ? null : 15
          setQueryLimit(limitUpdated)
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
  setQueryLimit: PropTypes.func.isRequired,
  setQueryOffset: PropTypes.func.isRequired,
}
