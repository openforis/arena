import React from 'react'
import PropTypes from 'prop-types'
import Split from 'react-split'
import Data from './components/Data'

import './Chart.scss'

// const downloadChart = (event) => {
//   const canvas = document.getElementById('canvas')
//   const ctx = canvas.getContext('2d')
//   const DOMURL = window.URL || window.webkitURL || window

//   const img = new Image()
//   const blob = new Blob([data?.svg], { type: 'image/svg+xml;charset=utf-8' })

//   const url = DOMURL.createObjectURL(blob)

//   ctx.drawImage(img, 0, 0)
//   DOMURL.revokeObjectURL(url)

//   const imgURI = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')

//   const a = document.createElement('a')
//   a.download = 'image.png'
//   a.href = imgURI
//   const clickEvt = new MouseEvent('click', {
//     view: window,
//     bubbles: true,
//     cancelable: true,
//   })
//   a.dispatchEvent(clickEvt)
//   a.remove()
// }

const Chart = ({ data, draft, renderChart, fullScreen }) => {
  const downloadChart = (event) => {
    const canvas = document.createElement('canvas')
    const chartImg = document.getElementById('chartImg')
    canvas.width = chartImg.naturalWidth
    canvas.height = chartImg.naturalHeight

    const ctx = canvas.getContext('2d')
    const DOMURL = window.URL || window.webkitURL || window

    const img = new Image()
    const blob = new Blob([data?.svg], { type: 'image/svg+xml' })

    const url = DOMURL.createObjectURL(blob)

    img.src = url

    img.onload = function () {
      ctx.drawImage(img, 0, 0)
      DOMURL.revokeObjectURL(url)

      const imgURI = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')

      const a = document.createElement('a')
      a.download = 'image.png'
      a.href = imgURI
      const clickEvt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
      })
      a.dispatchEvent(clickEvt)
      a.remove()
    }
  }

  return (
    <div className="charts_chart__container">
      {draft ? (
        <div className="charts_chart_draft_overlay">
          <button onClick={renderChart}>rerender</button>
        </div>
      ) : (
        <button onClick={downloadChart}>Download</button>
      )}
      {data && !draft && (
        <Split sizes={[70, 30]} expandToMin={true} className="wrap wrap_vertical" direction="vertical">
          <div className="charts_chart__image_container">
            {data?.svg && (
              <img
                src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(data?.svg)))}`}
                id="chartImg"
                alt=""
                width="100%"
                height="100%"
              />
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
  fullScreen: PropTypes.bool,
  draft: PropTypes.bool,
  renderChart: PropTypes.func.isRequired,
}

export default Chart
