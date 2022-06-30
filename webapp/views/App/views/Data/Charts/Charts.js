import './Charts.scss'
import React from 'react'
import { Query } from '@common/model/query'

import Chart from './components/Chart'
import Panel from './components/Panel'
import DataSelector from './components/DataSelector'
import { useNodeDefLabelSwitch } from '@webapp/components/survey/NodeDefLabelSwitch'

import Split from 'react-split'

import { useGetDimensionsFromArena, useChart } from './state/hooks'

const Charts = () => {
  const { nodeDefLabelType, toggleLabelFunction } = useNodeDefLabelSwitch()
  const { dimensions, entityDefUuid, setEntityDefUuid } = useGetDimensionsFromArena(nodeDefLabelType)

  const { spec, updateSpec, draft, chartImage, renderChart } = useChart(
    entityDefUuid ? Query.create({ entityDefUuid }) : null
  )

  return (
    <div className="charts">
      <Split sizes={[20, 20, 60]} expandToMin={true} minSize={[20, 20, 30]} class="wrap">
        <DataSelector
          setEntityDefUuid={setEntityDefUuid}
          entityDefUuid={entityDefUuid}
          nodeDefLabelType={nodeDefLabelType}
          toggleLabelFunction={toggleLabelFunction}
          dimensions={dimensions}
        />

        <Panel spec={spec} onUpdateSpec={updateSpec} dimensions={dimensions} />

        <Chart draft={draft} renderChart={renderChart} src={chartImage} />
      </Split>
    </div>
  )
}

export default Charts
