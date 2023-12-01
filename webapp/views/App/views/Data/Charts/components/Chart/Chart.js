import React from 'react'
import PropTypes from 'prop-types'
import Split from 'react-split'
import Data from './components/Data'
import ScatterPlot from './components/ChartTypes/ScatterPlot/'
import BarChart from './components/ChartTypes/BarChart/'
import PieChart from './components/ChartTypes/PieChart/'
import './Chart.scss'

const Chart = ({ data, specs, fullScreen, chartRef }) => {
  const chartType = specs?.chartType
  const hasData = Boolean(data)
  const hasSvg = Boolean(data?.svg)

  const CHART_TYPES = {
    SCATTER_PLOT: 'scatterPlot',
    BAR_CHART: 'barChart',
    PIE_CHART: 'pieChart',
  }

  const chartComponentByType = {
    [CHART_TYPES.SCATTER_PLOT]: ScatterPlot,
    [CHART_TYPES.BAR_CHART]: BarChart,
    [CHART_TYPES.PIE_CHART]: PieChart,
  }

  const ChartComponent = chartComponentByType[chartType]

  const downloadPng = () => {
    const chart = chartRef?.current
    if (chart) {
      const svgElement = chart.querySelector('svg')
      if (svgElement) {
        // Serialize SVG
        const serializer = new XMLSerializer()
        const svgString = serializer.serializeToString(svgElement)
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        // Create an Image element
        const img = new Image()
        img.src = url
        img.onload = () => {
          // Create a canvas element
          const canvas = document.createElement('canvas')
          canvas.width = svgElement.clientWidth
          canvas.height = svgElement.clientHeight
          const ctx = canvas.getContext('2d')

          // Draw the image onto the canvas
          ctx.drawImage(img, 0, 0)

          // Create a download link for the canvas image
          const pngUrl = canvas.toDataURL('image/png')
          const downloadLink = document.createElement('a')
          downloadLink.href = pngUrl
          downloadLink.download = 'chart.png'
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
          URL.revokeObjectURL(url)
        }
      } else {
        console.error('No SVG element found inside the chart container.')
      }
    } else {
      console.error('Chart container ref is not available.')
    }
  }

  if (!hasData) {
    return null
  }

  return (
    <div className="charts_chart__container">
      <button onClick={downloadPng}>Download PNG</button>
      {(chartType || hasSvg) && (
        <Split sizes={[70, 30]} expandToMin={true} className="wrap wrap_vertical" direction="vertical">
          <div className="charts_chart__image_container">
            {ChartComponent ? (
              <ChartComponent specs={specs} originalData={data} chartRef={chartRef} />
            ) : (
              hasSvg && (
                <img
                  src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(data.svg)))}`}
                  id="chartImg"
                  alt="chart"
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
  chartRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.instanceOf(Element) })]),
}

export default Chart
