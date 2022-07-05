import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import ModeSelector from './components/ModeSelector'
import RawChartBuilder from './components/RawChartBuilder'
import BlocksBuilder from './components/BlocksBuilder'

import { panelModes } from '../../state/config'

const useModeSelector = () => {
  const [currentMode, setCurrentMode] = useState(Object.keys(panelModes)[0])

  const onSelectMode = useCallback((modeKey) => {
    setCurrentMode(modeKey)
  }, [])

  return { currentMode, onSelectMode }
}
const Panel = ({ dimensions, spec, onUpdateSpec }) => {
  const { currentMode, onSelectMode } = useModeSelector()

  return (
    <div className="charts_panel__container">
      <ModeSelector modes={panelModes} currentMode={currentMode} onSelectMode={onSelectMode} />

      <RawChartBuilder
        visible={currentMode === panelModes.RAW}
        dimensions={dimensions}
        spec={spec}
        onUpdateSpec={onUpdateSpec}
      />

      <BlocksBuilder
        visible={currentMode === panelModes.BUILDER}
        spec={spec}
        onUpdateSpec={onUpdateSpec}
        dimensions={dimensions}
      />
    </div>
  )
}

Panel.propTypes = {
  spec: PropTypes.object.isRequired,
  onUpdateSpec: PropTypes.func.isRequired,
  dimensions: PropTypes.arrayOf(PropTypes.any),
}

export default Panel
