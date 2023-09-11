import React from 'react'
import PropTypes from 'prop-types'
import Split from 'react-split'
import Data from './components/Data'
import ScatterPlot from './components/ChartTypes/ScatterPlot/'
import BarChart from './components/ChartTypes/BarChart/'
import './Chart.scss'

const Chart = ({ data, specs, draft, renderChart, fullScreen }) => {
  const chartType = specs?.chartType
  const hasData = Boolean(data)
  const hasSvg = Boolean(data?.svg)

  const ChartComponent = chartType === 'scatterPlot' ? ScatterPlot : BarChart

  if (!hasData) {
    return null
  }

  return (
    <div className="charts_chart__container">
      {draft && !['scatterPlot', 'barChart'].includes(chartType) && (
        <div className="charts_chart_draft_overlay">
          <button onClick={renderChart}>rerender</button>
        </div>
      )}
      {(chartType || hasSvg) && (
        <Split sizes={[70, 30]} expandToMin={true} className="wrap wrap_vertical" direction="vertical">
          <div className="charts_chart__image_container">
            {chartType ? (
              <ChartComponent specs={specs} originalData={data} />
            ) : (
              hasSvg && (
                <img
                  src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(data.svg)))}`}
                  id="chartImg"
                  alt=""
                  width="100%"
                  height="100%"
                />
              )
            )}
          </div>
          {data?.table && <Data data={data} fullScreen={fullScreen} />}
        </Split>
      )}
    </div>
  )
}

Chart.propTypes = {
  data: PropTypes.object,
  specs: PropTypes.object,
  fullScreen: PropTypes.bool,
  draft: PropTypes.bool,
  renderChart: PropTypes.func.isRequired,
}

export default Chart
