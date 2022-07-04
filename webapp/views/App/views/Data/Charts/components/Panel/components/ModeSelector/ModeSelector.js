import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import './ModeSelector.scss'

const ModeSelector = ({ modes, currentMode, onSelectMode }) => {
  return (
    <div className="mode-selector">
      {Object.keys(modes).map((modeKey) => (
        <button
          key={modeKey}
          className={classNames('mode-selector__option', { active: currentMode === modeKey })}
          onClick={() => onSelectMode(modeKey)}
        >
          {modeKey}
        </button>
      ))}
    </div>
  )
}

ModeSelector.propTypes = {
  currentMode: PropTypes.string.isRequired,
  onSelectMode: PropTypes.func.isRequired,
  modes: PropTypes.objectOf(String).isRequired,
}

export default ModeSelector
