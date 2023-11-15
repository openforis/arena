import React, { useCallback, useMemo, useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { uuidv4 } from '@core/uuid'
import './Metric.scss'
import { Popover } from 'react-tiny-popover'
import RenderByType from '../BlockRenderer/BlockRenderer'
import { ButtonAdd } from '@webapp/components'

const PopoverContent = (props) => {
  const {
    config,
    configItemsByPath,
    configActions,
    blockPath,
    dimensions,
    block,
    setIsPopoverOpen,
    values = {},
    metric,
  } = props
  const { blocks, order } = block

  const [draftValues, setDraftValues] = useState(values || {})
  const [draftMetric, setDraftMetric] = useState(metric)

  const handleChange = useCallback(
    (newValue) => {
      setDraftValues((_draftValues) =>
        Object.assign({}, _draftValues, {
          [newValue.blockKey]: newValue.value.map((_val) => Object.assign({}, _val, { parentKey: draftMetric.key })),
        })
      )
    },
    [draftValues, draftMetric]
  )

  const handleSaveOrUpdate = useCallback(() => {
    configActions.addOrUpdateMetric({ blockPath, metric: draftMetric, values: draftValues })

    setIsPopoverOpen(false)
  }, [blockPath, draftValues, draftMetric])

  useEffect(() => {
    if (!metric) {
      setDraftMetric({ key: uuidv4() })
    }
  }, [])

  return (
    <div className="custom-option-modal-container">
      <div className="custom-option-modal-header">
        <p>Add a new metric aggregation.</p>
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
              onChange: handleChange,
              values,
            })
          )}
      </div>
      <div className="custom-option-modal-actions">
        <button onClick={() => setIsPopoverOpen(false)}>close</button>
        <button onClick={handleSaveOrUpdate} disabled={Object.values(draftValues).length !== order.length}>
          save
        </button>
      </div>
    </div>
  )
}

PopoverContent.propTypes = {
  config: PropTypes.object.isRequired,
  configItemsByPath: PropTypes.object.isRequired,
  configActions: PropTypes.object.isRequired,
  blockPath: PropTypes.string.isRequired,
  dimensions: PropTypes.array.isRequired,
  block: PropTypes.object.isRequired,
  setIsPopoverOpen: PropTypes.func.isRequired,
  values: PropTypes.object,
  metric: PropTypes.object,
}

const CustomPopover = (props) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const { metric, values, config, configItemsByPath, configActions, blockPath, children, block, dimensions } = props

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
        <PopoverContent
          config={config}
          configItemsByPath={configItemsByPath}
          configActions={configActions}
          blockPath={blockPath}
          dimensions={dimensions}
          block={block}
          setIsPopoverOpen={setIsPopoverOpen}
          metric={metric}
          values={values}
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

CustomPopover.propTypes = {
  metric: PropTypes.object,
  values: PropTypes.object,
  config: PropTypes.object.isRequired,
  configItemsByPath: PropTypes.object.isRequired,
  configActions: PropTypes.object.isRequired,
  blockPath: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  block: PropTypes.object.isRequired,
  dimensions: PropTypes.array.isRequired,
}

const Metric = ({ config, configItemsByPath, configActions, blockPath, dimensions, block, metric }) => {
  const values = useMemo(() => {
    const blockItems = block.order.reduce((valuesInBlock, orderKey) => {
      const val = configItemsByPath?.[`${blockPath}.${orderKey}`]?.value?.filter((_val) => {
        return _val.parentKey === metric.key
      })
      return { ...valuesInBlock, [orderKey]: val }
    }, {})

    return blockItems
  }, [configItemsByPath, blockPath])

  const handleDelete = useCallback(
    (e) => {
      e.stopPropagation()
      configActions.deleteMetric({ blockPath, metric, values })
    },
    [metric, blockPath, values]
  )

  return (
    <CustomPopover
      config={config}
      configItemsByPath={configItemsByPath}
      configActions={configActions}
      blockPath={blockPath}
      block={block}
      dimensions={dimensions}
      metric={metric}
      values={values}
    >
      <div className="block-metric-metrics-item">
        <p>{block.labelBuilder(values)}</p>

        <button type="button" className="btn btn-s btn-remove icon-delete" onClick={handleDelete}>
          <span className="icon icon-cross icon-8px" />
        </button>
      </div>
    </CustomPopover>
  )
}

Metric.propTypes = {
  config: PropTypes.object.isRequired,
  configItemsByPath: PropTypes.object.isRequired,
  configActions: PropTypes.object.isRequired,
  blockPath: PropTypes.string.isRequired,
  dimensions: PropTypes.array.isRequired,
  block: PropTypes.object.isRequired,
  metric: PropTypes.object.isRequired,
}

const MetricBlock = ({ config, configItemsByPath, configActions, blockPath, dimensions, block }) => {
  const { title, subtitle } = block

  const options = useMemo(() => {
    const metrics = configItemsByPath?.[blockPath]?.value || []
    return (block.options || dimensions).filter((option) => !metrics.some((metric) => metric.key === option.key))
  }, [dimensions, block, configItemsByPath, blockPath])

  const flatOptions = useMemo(() => {
    const metrics = configItemsByPath?.[blockPath]?.value || []
    return (block.options || options.flatMap((d) => d.options)).filter(
      (option) => !metrics.some((metric) => metric.key === option.key)
    )
  }, [options, block, configItemsByPath, blockPath])

  const metrics = useMemo(() => configItemsByPath?.[blockPath]?.value || [], [configItemsByPath, blockPath])

  return (
    <div className="block block-metric">
      <div className="block-metric-header">
        <div className="block-metric-header-text">
          <span className="block__title">{title}</span>
          <span className="block__subtitle">{subtitle}</span>
        </div>
        <div className="block-metric-button-container">
          <CustomPopover
            config={config}
            configItemsByPath={configItemsByPath}
            configActions={configActions}
            blockPath={blockPath}
            block={block}
            dimensions={dimensions}
          >
            <ButtonAdd showLabel={false} size="small" />
          </CustomPopover>
        </div>
      </div>
      <div className="block-metric-metrics-container">
        {metrics.map((metric) => (
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
        ))}
      </div>
      <span className="block__number-options">{flatOptions.length} Option(s)</span>
    </div>
  )
}

MetricBlock.propTypes = {
  config: PropTypes.object.isRequired,
  configItemsByPath: PropTypes.object.isRequired,
  configActions: PropTypes.object.isRequired,
  blockPath: PropTypes.string.isRequired,
  dimensions: PropTypes.array.isRequired,
  block: PropTypes.object.isRequired,
}

export default MetricBlock
