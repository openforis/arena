import React, { useCallback, useState, useEffect } from 'react'
import { uuidv4 } from '@core/uuid'
import './SingleMetric.scss'
import { Popover } from 'react-tiny-popover'
import RenderByType from '../BlockRenderer/BlockRenderer'
import { ButtonAdd } from '@webapp/components'

const SinglePopoverContent = (props) => {
  const {
    config,
    configItemsByPath,
    configActions,
    blockPath,
    dimensions,
    block,
    setIsPopoverOpen,
    metric,
  } = props
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

const SingleMetricBlock = ({ config, configItemsByPath, configActions, blockPath, dimensions, block }) => {
  const { title, subtitle } = block

  const options = useMemo(() => block.options || dimensions, [dimensions, block])
  const flatOptions = useMemo(() => block.options || options.flatMap((d) => d.options), [options, block])

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
      <span className="block__number-options">{flatOptions.length} Option(s)</span>
    </div>
  )
}

export default SingleMetricBlock
