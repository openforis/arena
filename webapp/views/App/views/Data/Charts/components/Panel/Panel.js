import React, { useCallback, useState } from 'react'

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

      {currentMode === panelModes.RAW && (
        <RawChartBuilder dimensions={dimensions} spec={spec} onUpdateSpec={onUpdateSpec} />
      )}
      {currentMode === panelModes.BUILDER && (
        <BlocksBuilder spec={spec} onUpdateSpec={onUpdateSpec} dimensions={dimensions} />
      )}
    </div>
  )
}

Panel.propTypes = {}

export default Panel
