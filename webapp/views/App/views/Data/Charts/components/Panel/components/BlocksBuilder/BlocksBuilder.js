import './BlocksBuilder.scss'

import React from 'react'
import PropTypes from 'prop-types'

import { chartsConfig } from '../../../../state/config'

import CheckboxBlock from './blocks/Checkbox'
import ContainerBlock from './blocks/Container'
import InputBlock from './blocks/Input'
import MetricBlock from './blocks/Metric'
import SelectBlock from './blocks/Select'
import SingleMetricBlock from './blocks/SingleMetric'
import SliderBlock from './blocks/Slider'

const RenderByType = {
  container: ContainerBlock,
  select: SelectBlock,
  metric: MetricBlock,
  singleMetric: SingleMetricBlock,
  input: InputBlock,
  slider: SliderBlock,
  checkbox: CheckboxBlock,
}

const BaseBlock = () => <div></div>
const BlocksBuilder = ({ config, configItemsByPath, configActions, dimensions, visible = true, blockPath = '' }) => {
  const builderBlocks = chartsConfig?.[config.type]?.builderBlocks
  return (
    <div className={`blocks-builder ${visible ? 'visible' : ''}`}>
      {Object.keys(chartsConfig).map((configKey) => (
        <button
          key={configKey}
          className={`${configKey === config.type ? 'active' : ''}`}
          onClick={() => {
            configActions.changeType(configKey)
          }}
        >
          {chartsConfig[configKey].selector.title}
        </button>
      ))}
      {config.type &&
        builderBlocks.order.map((blockKey) =>
          React.createElement(RenderByType[builderBlocks?.blocks[blockKey].type] || BaseBlock, {
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
  visible: PropTypes.bool,
  dimensions: PropTypes.arrayOf(PropTypes.any),
  config: PropTypes.shape({
    type: PropTypes.string,
  }).isRequired,
  configItemsByPath: PropTypes.object.isRequired,
  configActions: PropTypes.shape({
    changeType: PropTypes.func,
  }).isRequired,
  blockPath: PropTypes.string,
}

export default BlocksBuilder
