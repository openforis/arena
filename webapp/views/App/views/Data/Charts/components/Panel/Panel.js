import React from 'react'
import PropTypes from 'prop-types'
import RawChartBuilder from './components/RawChartBuilder'

const Panel = ({ dimensions, spec, onUpdateSpec }) => {
  return (
    <div className="charts_panel__container">
      <RawChartBuilder dimensions={dimensions} spec={spec} onUpdateSpec={onUpdateSpec} />
    </div>
  )
}

Panel.propTypes = {
  spec: PropTypes.string.isRequired,
  onUpdateSpec: PropTypes.func.isRequired,
  dimensions: PropTypes.arrayOf(Object).isRequired,
}

export default Panel