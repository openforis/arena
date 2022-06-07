import React from 'react'

import RawChartBuilder from './components/RawChartBuilder'

const Panel = ({ spec, onUpdateSpec }) => {
  return (
    <div className="charts_panel__container">
      <RawChartBuilder spec={spec} onUpdateSpec={onUpdateSpec} />
    </div>
  )
}

Panel.propTypes = {}

export default Panel
