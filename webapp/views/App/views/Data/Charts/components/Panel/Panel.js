import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

const Panel = ({ dimensions, spec, onUpdateSpec }) => {
  return <div className="charts_panel__container"></div>
}

Panel.propTypes = {
  spec: PropTypes.string.isRequired,
  onUpdateSpec: PropTypes.func.isRequired,
  dimensions: PropTypes.arrayOf(Object).isRequired,
}

export default Panel
