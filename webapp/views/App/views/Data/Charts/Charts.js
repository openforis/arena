import './Charts.scss'
import React from 'react'

import Visualizer from './Visualizer'

const Chart = () => {
  return (
    <div className="charts">
      <div className="charts_panel__container">Panel</div>
      <Visualizer src={`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent('chartImage')))}`} />
    </div>
  )
}

export default Chart
