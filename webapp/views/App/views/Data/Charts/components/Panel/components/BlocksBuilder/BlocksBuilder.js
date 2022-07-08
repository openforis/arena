import React from 'react'
import PropTypes from 'prop-types'

import { chartsConfig } from '../../../../state/config'
import ContainerBlock from './blocks/Container'
import SelectBlock from './blocks/Select'
import MetricBlock from './blocks/Metric'
import './BlocksBuilder.scss'

const RenderByType = {
  container: ContainerBlock,
  select: SelectBlock,
  metric: MetricBlock,
}

const BlocksBuilder = ({ config, configItemsByPath, configActions, visible, dimensions, blockPath = '' }) => {
  const builderBlocks = chartsConfig?.[config.type]?.builderBlocks
  return (
    <div className={`blocks-builder ${visible ? 'visible' : ''}`}>
      {Object.keys(chartsConfig).map((configKey) => (
        <button
          key={configKey}
          onClick={() => {
            configActions.changeType(configKey)
          }}
        >
          {chartsConfig[configKey].selector.title}
        </button>
      ))}
      {config.type &&
        builderBlocks.order.map((blockKey) =>
          React.createElement(RenderByType[builderBlocks?.blocks[blockKey].type], {
            key: blockKey,
            dimensions,
            block: builderBlocks?.blocks[blockKey],
            config,
            configItemsByPath,
            configActions,
            blockPath: blockPath ? blockPath.split('.').concat([blockKey]).join('.') : blockKey,
          })
        )}
    </div>
  )
}

BlocksBuilder.propTypes = {
  visible: PropTypes.bool.isRequired,

  dimensions: PropTypes.arrayOf(PropTypes.any),
}

export default BlocksBuilder
