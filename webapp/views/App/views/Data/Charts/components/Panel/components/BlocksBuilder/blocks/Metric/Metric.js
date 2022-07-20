import React, { useCallback, useMemo, useState, useEffect } from 'react'
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
        <button onClick={handleSaveOrUpdate}>save</button>
      </div>
    </div>
  )
}

const CustomPopover = (props) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const { metric, values, config, configItemsByPath, configActions, blockPath, children, block, dimensions } = props

  return (
    <Popover
      padding={8}
      isOpen={isPopoverOpen}
      onClickOutside={() => setIsPopoverOpen(false)}
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

  console.log('LABEL BUILDER', configItemsByPath, values)

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
        <p>{block.labelBuilder(configItemsByPath)}</p>
      </div>
    </CustomPopover>
  )
}

const MetricBlock = ({ config, configItemsByPath, configActions, blockPath, dimensions, block }) => {
  const { title, subtitle } = block

  const options = useMemo(() => block.options || dimensions, [dimensions, block])
  const flatOptions = useMemo(() => block.options || options.flatMap((d) => d.options), [options, block])

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

export default MetricBlock
