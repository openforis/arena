import './Charts.scss'
import React, { useState, useEffect, useRef } from 'react'
import { Query } from '@common/model/query'
import { Button } from '@webapp/components/buttons'
import Chart from './components/Chart'
import Panel from './components/Panel'
import DataSelector from './components/DataSelector'
import { useNodeDefLabelSwitch } from '@webapp/components/survey/NodeDefLabelSwitch'
import { D3_CHART_TYPES } from './constants/chartTypes'

import Split from 'react-split'

import { useGetDimensionsFromArena, useChart } from './state/hooks'
import classNames from 'classnames'

const Charts = () => {
  const [fullScreen, setFullScreen] = useState(false)
  const { nodeDefLabelType, toggleLabelFunction } = useNodeDefLabelSwitch()
  const { dimensions, entityDefUuid, setEntityDefUuid } = useGetDimensionsFromArena(nodeDefLabelType)
  const chartRef = useRef(null)

  const { config, configItemsByPath, configActions, spec, updateSpec, draft, chartData, renderChart } = useChart(
    entityDefUuid ? Query.create({ entityDefUuid }) : null,
    entityDefUuid,
    setEntityDefUuid
  )

  useEffect(() => {
    if (D3_CHART_TYPES.includes(spec.chartType) && !chartData) {
      renderChart()
    }
  }, [spec, chartData])

  useEffect(() => {
    updateSpec(JSON.stringify({ ...spec, query: {}, chart: {} }))
  }, [spec.chartType])

  return (
    <div className={classNames('charts', { 'full-screen': fullScreen })}>
      <div className="charts_header">
        <Button
          className="full-screen-button"
          iconClassName={classNames('icon-10px', { 'icon-shrink2': fullScreen, 'icon-enlarge2': !fullScreen })}
          onClick={() => setFullScreen(!fullScreen)}
        />
      </div>
      <Split sizes={[20, 20, 60]} expandToMin={true} minSize={[20, 20, 30]} className="wrap">
        <DataSelector
          setEntityDefUuid={setEntityDefUuid}
          entityDefUuid={entityDefUuid}
          nodeDefLabelType={nodeDefLabelType}
          toggleLabelFunction={toggleLabelFunction}
          dimensions={dimensions}
        />

        <Panel
          config={config}
          configItemsByPath={configItemsByPath}
          configActions={configActions}
          spec={spec}
          onUpdateSpec={updateSpec}
          dimensions={dimensions}
        />

        <Chart
          specs={spec}
          draft={draft}
          renderChart={renderChart}
          data={chartData}
          fullScreen={fullScreen}
          chartRef={chartRef}
        />
      </Split>
    </div>
  )
}

export default Charts
