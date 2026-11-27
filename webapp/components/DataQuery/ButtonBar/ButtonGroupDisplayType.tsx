import { useCallback, useEffect, useMemo } from 'react'

import { Query } from '@common/model/query'
import { IconName } from '@webapp/components/AppIcon'
import { ButtonGroup } from '@webapp/components/form'
import { useAppDispatch } from '@webapp/store'
import { DataExplorerActions, DataExplorerSelectors, DataExplorerState } from '@webapp/store/dataExplorer'

const { displayTypes, chartTypes, isChartTypeAvailable } = DataExplorerState

const iconByDisplayType: Record<string, IconName> = {
  [displayTypes.chart]: 'pieChart',
  [displayTypes.table]: 'table',
}

const displayTypeItems = Object.keys(displayTypes).map((displayType) => ({
  key: displayType,
  iconName: iconByDisplayType[displayType],
  label: `dataView:dataQuery.displayType.${displayType}`,
}))

const iconByChartType: Record<string, IconName> = {
  [chartTypes.area]: 'areaChart',
  [chartTypes.bar]: 'barChart',
  [chartTypes.line]: 'lineChart',
  [chartTypes.pie]: 'pieChart',
  [chartTypes.scatter]: 'scatterChart',
}

const getChartTypeItemByKey = (chartType) => ({
  key: chartType,
  iconName: iconByChartType[chartType],
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

type ButtonGroupDisplayTypeProps = {
  setQueryLimit: (...args: any[]) => any
  setQueryOffset: (...args: any[]) => any
}

export const ButtonGroupDisplayType = (props: ButtonGroupDisplayTypeProps) => {
  const { setQueryLimit, setQueryOffset } = props
  const dispatch = useAppDispatch()
  const displayType = DataExplorerSelectors.useDisplayType()
  const chartType = DataExplorerSelectors.useChartType()
  const query = DataExplorerSelectors.useQuery()
  const queryMode = Query.getMode(query)

  const chartTypeItems = useMemo(() => {
    const availableTypes = Object.keys(chartTypes).filter(isChartTypeAvailable({ queryMode }))
    return availableTypes.map(getChartTypeItemByKey)
  }, [queryMode])

  // display or chart type can change also when changing the query mode, resetting the entity or from code (assistant
  // query cards): the page of the previous display does not apply to the new one
  useEffect(() => {
    setQueryOffset(0)
    setQueryLimit(getQueryLimit({ displayType, chartType }))
  }, [chartType, displayType, setQueryLimit, setQueryOffset])

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
