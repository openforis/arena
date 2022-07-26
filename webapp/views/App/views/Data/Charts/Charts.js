import './Charts.scss'
import React, { useState } from 'react'
import { Query } from '@common/model/query'
import { Button } from '@webapp/components/buttons'
import Chart from './components/Chart'
import Panel from './components/Panel'
import DataSelector from './components/DataSelector'
import { useNodeDefLabelSwitch } from '@webapp/components/survey/NodeDefLabelSwitch'

import Split from 'react-split'

import { useGetDimensionsFromArena, useChart } from './state/hooks'
import classNames from 'classnames'

const Charts = () => {
  const [fullScreen, setFullScreen] = useState(false)
  const { nodeDefLabelType, toggleLabelFunction } = useNodeDefLabelSwitch()
  const { dimensions, entityDefUuid, setEntityDefUuid } = useGetDimensionsFromArena(nodeDefLabelType)

  const { config, configItemsByPath, configActions, spec, updateSpec, draft, chartImage, renderChart } = useChart(
    entityDefUuid ? Query.create({ entityDefUuid }) : null,
    entityDefUuid,
    setEntityDefUuid
  )

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

        <Chart draft={draft} renderChart={renderChart} src={chartImage} />
      </Split>
    </div>
  )
}

export default Charts
