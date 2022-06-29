import React, { useState } from 'react'
import PropTypes from 'prop-types'

import { chartsConfig } from '../../../../state/config'
import ContainerBlock from './blocks/Container'
import InputBlock from './blocks/Input'
import './BlocksBuilder.scss'

const RenderByType = {
  container: ContainerBlock,
  input: InputBlock,
}

const BlocksBuilder = ({ dimensions, spec, onUpdateSpec }) => {
  const [type, setType] = useState(null)
  const builderBlocks = chartsConfig[type].builderBlocks
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
      {type &&
        builderBlocks.order.map((blockKey) =>
          React.createElement(RenderByType[chartsConfig[type].builderBlocks.blocks[blockKey].type], {
            key: blockKey,
            dimensions,
            spec,
            onUpdateSpec,
            block: chartsConfig[type].builderBlocks.blocks[blockKey],
          })
        )}
    </div>
  )
}

BlocksBuilder.propTypes = {
  spec: PropTypes.string.isRequired,
  onUpdateSpec: PropTypes.func.isRequired,
}

export default BlocksBuilder
