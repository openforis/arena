import React from 'react'
import PropTypes from 'prop-types'
import Split from 'react-split'
import Data from './components/Data'
import ScatterPlot from './components/ChartTypes/ScatterPlot/'
import BarChart from './components/ChartTypes/BarChart/'
import PieChart from './components/ChartTypes/PieChart/'
import './Chart.scss'

const Chart = ({ data, specs, fullScreen }) => {
  const chartType = specs?.chartType
  const hasData = Boolean(data)
  const hasSvg = Boolean(data?.svg)

  let ChartComponent
  switch (chartType) {
    case 'scatterPlot':
      ChartComponent = ScatterPlot
      break
    case 'barChart':
      ChartComponent = BarChart
      break
    case 'pieChart':
      ChartComponent = PieChart
      break
    default:
      ChartComponent = null
  }

  if (!hasData) {
    return null
  }

  return (
    <div className="charts_chart__container">
      {(chartType || hasSvg) && (
        <Split sizes={[70, 30]} expandToMin={true} className="wrap wrap_vertical" direction="vertical">
          <div className="charts_chart__image_container">
            {ChartComponent ? (
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
