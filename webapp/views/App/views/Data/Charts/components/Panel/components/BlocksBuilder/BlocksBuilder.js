import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'

import Select from 'react-select'
import { chartsConfig } from '../../../../state/config'
import './BlocksBuilder.scss'

const BlocksBuilder = ({ dimensions, spec, onUpdateSpec }) => {
  const [type, setType] = useState(null)
  return (
    <div className="blocks-builder">
      {Object.keys(chartsConfig).map((configKey) => (
        <button
          key={configKey}
          onClick={() => {
            chartsConfig[configKey].selector.onSelect({ spec, onUpdateSpec })()
            setType(configKey)
          }}
        >
          {chartsConfig[configKey].selector.title}
        </button>
      ))}
      <p>{type}</p>
    </div>
  )
}

BlocksBuilder.propTypes = {
  spec: PropTypes.string.isRequired,
  onUpdateSpec: PropTypes.func.isRequired,
}

export default BlocksBuilder
