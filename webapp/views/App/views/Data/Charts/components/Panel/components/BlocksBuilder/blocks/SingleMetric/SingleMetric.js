import './SingleMetric.scss'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Popover } from 'react-tiny-popover'

import { uuidv4 } from '@core/uuid'

import { ButtonAdd } from '@webapp/components'

import RenderByType from '../BlockRenderer/BlockRenderer'
import Metric from '../Metric'

const SinglePopoverContent = (props) => {
  const { config, configItemsByPath, configActions, blockPath, dimensions, block, setIsPopoverOpen, metric } = props
  const { blocks, order } = block

  const [draftMetric, setDraftMetric] = useState(metric)

  const handleSaveOrUpdate = useCallback(() => {
    configActions.addOrUpdateMetric({ blockPath, metric: draftMetric })
    setIsPopoverOpen(false)
  }, [blockPath, draftMetric])

  useEffect(() => {
    if (!metric) {
      setDraftMetric({ key: uuidv4() })
    }
  }, [])

  return (
    <div className="custom-option-modal-container">
      <div className="custom-option-modal-header">
        <p>Add a new metric.</p>
      </div>
      <div className="custom-option-modal-blocks">
        {draftMetric?.key &&
          order.map((blockKey) =>
            React.createElement(RenderByType[blocks[blockKey].type], {
              key: blockKey,
              dimensions,
              block: blocks[blockKey],
              config,
              configItemsByPath,
              configActions,
              blockPath: blockPath ? blockPath.split('.').concat([blockKey]).join('.') : blockKey,
              metric,
            })
          )}
      </div>
      <div className="custom-option-modal-actions">
        <button onClick={() => setIsPopoverOpen(false)}>close</button>
        <button onClick={handleSaveOrUpdate}>save</button>
      </div>
    </div>
  )
}

SinglePopoverContent.propTypes = {
  config: PropTypes.object.isRequired,
  configItemsByPath: PropTypes.object.isRequired,
  configActions: PropTypes.object.isRequired,
  blockPath: PropTypes.string.isRequired,
  dimensions: PropTypes.array.isRequired,
  block: PropTypes.object.isRequired,
  setIsPopoverOpen: PropTypes.func.isRequired,
  metric: PropTypes.object,
}

const SingleCustomPopover = (props) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const { metric, config, configItemsByPath, configActions, blockPath, children, block, dimensions } = props

  const elementIsDropdownOption = (el) =>
    el?.classList?.contains('dropdown__option') || el?.classList?.contains('dropdown-option__label')

  const onClickOutside = (e) => {
    if (!elementIsDropdownOption(e.target)) {
      setIsPopoverOpen(false)
    }
  }

  return (
    <Popover
      padding={8}
      isOpen={isPopoverOpen}
      onClickOutside={onClickOutside}
      positions={['right', 'top', 'left', 'bottom']}
      align={'center'}
      content={
        <SinglePopoverContent
          config={config}
          configItemsByPath={configItemsByPath}
          configActions={configActions}
          blockPath={blockPath}
          dimensions={dimensions}
          block={block}
          setIsPopoverOpen={setIsPopoverOpen}
          metric={metric}
        />
      }
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setIsPopoverOpen(!isPopoverOpen)
        }}
      >
        {children}
      </div>
    </Popover>
  )
}

SingleCustomPopover.propTypes = {
  metric: PropTypes.object,
  config: PropTypes.object.isRequired,
  configItemsByPath: PropTypes.object.isRequired,
  configActions: PropTypes.object.isRequired,
  blockPath: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  block: PropTypes.object.isRequired,
  dimensions: PropTypes.array.isRequired,
}

const SingleMetricBlock = ({ config, configItemsByPath, configActions, blockPath, dimensions, block }) => {
  const { title, subtitle } = block

  const metric = useMemo(() => configItemsByPath?.[blockPath]?.value[0] || null, [configItemsByPath, blockPath])

  return (
    <div className="block block-metric">
      <div className="block-metric-header">
        <div className="block-metric-header-text">
          <span className="block__title">{title}</span>
          <span className="block__subtitle">{subtitle}</span>
        </div>
        {!metric && (
          <div className="block-metric-button-container">
            <SingleCustomPopover
              config={config}
              configItemsByPath={configItemsByPath}
              configActions={configActions}
              blockPath={blockPath}
              block={block}
              dimensions={dimensions}
            >
              <ButtonAdd showLabel={false} size="small" />
            </SingleCustomPopover>
          </div>
        )}
      </div>
      <div className="block-metric-metrics-container">
        {metric && (
          <Metric
            config={config}
            configItemsByPath={configItemsByPath}
            configActions={configActions}
            blockPath={blockPath}
            block={block}
            dimensions={dimensions}
            key={metric.key}
            metric={metric}
          />
        )}
      </div>
    </div>
  )
}

SingleMetricBlock.propTypes = {
  config: PropTypes.object.isRequired,
  configItemsByPath: PropTypes.object.isRequired,
  configActions: PropTypes.object.isRequired,
  blockPath: PropTypes.string.isRequired,
  dimensions: PropTypes.array.isRequired,
  block: PropTypes.object.isRequired,
}

export default SingleMetricBlock
