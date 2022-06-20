import React from 'react'
import RawChartBuilder from './components/RawChartBuilder'

const Panel = ({ dimensions, spec, onUpdateSpec }) => {
  return (
    <div className="charts_panel__container">
      <RawChartBuilder dimensions={dimensions} spec={spec} onUpdateSpec={onUpdateSpec} />
    </div>
  )
}

Panel.propTypes = {}

export default Panel