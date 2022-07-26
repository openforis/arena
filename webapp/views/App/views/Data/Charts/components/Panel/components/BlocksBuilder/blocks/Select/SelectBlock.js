import React, { useCallback, useMemo } from 'react'
import { uuidv4 } from '@core/uuid'
import Select, { components } from 'react-select'
import './SelectBlock.scss'

const icons = {
  quantitative: <span className="icon-left node_def__icon">1.23</span>,
  nominal: (
    <span className="icon-left display-flex">
      {[0, 1, 2].map((i) => (
        <span key={i} className="icon icon-text-color" style={{ margin: '0 -3px' }} />
      ))}
    </span>
  ),
  temporal: <span className="icon icon-clock icon-left" />,
}

const CustomOption = (props) => {
  const { data, showIcons } = props

  return (
    <components.Option {...props}>
      <div className="option">
        {data.label}
        {showIcons && icons[data.type]}
      </div>
    </components.Option>
  )
}

const useOptionsAndDefaultValues = ({ block, dimensions }) => {
  const { optionsParams = {} } = block
  const { filter = [] } = optionsParams

  const options = useMemo(() => {
    const _filter = (option) => (filter.length > 0 && option.type ? filter.includes(option.type) : true)

    if (block.options) {
      return block.options.filter(_filter)
    }

    return dimensions.map((dimension) =>
      Object.assign({}, dimension, {
        options: (dimension.options || []).filter(_filter),
      })
    )
  }, [dimensions, block, filter])

  const flatOptions = useMemo(() => block.options || options.flatMap((d) => d.options), [options, block])

  return { options, flatOptions }
}

const useDefaultValue = ({ configItemsByPath, flatOptions, block, values, blockPath }) => {
  return useMemo(() => {
    if (flatOptions.length > 0) {
      let blockValues = []
      if (values) {
        return values[block.id]?.[0] || {}
      }
      if (configItemsByPath[blockPath]) {
        blockValues = configItemsByPath[blockPath] ? configItemsByPath[blockPath].value : []
        return blockValues
      }

      return flatOptions.filter((option) => blockValues.some((val) => val.value === option.value))
    }
  }, [configItemsByPath, blockPath, flatOptions])
}
const SelectBlock = ({ configItemsByPath, configActions, blockPath, dimensions, block, onChange, values }) => {
  const { title, subtitle, id, isMulti, optionsParams = {} } = block
  const { showIcons = true } = optionsParams
  const { options, flatOptions } = useOptionsAndDefaultValues({ block, dimensions })
  const defaultValues = useDefaultValue({ configItemsByPath, flatOptions, block, values, blockPath })

  const handleChange = useCallback(
    (optionsSelected) => {
      console.log(optionsSelected)
      let option = optionsSelected || null
      if (!isMulti) {
        option = optionsSelected ? [optionsSelected] : []
      }
      option = option.map((item) =>
        item.key ? item : Object.assign({}, item, { key: defaultValues?.key || uuidv4() })
      )

      if (onChange) {
        onChange({ blockKey: id, blockPath, value: option })
      } else {
        configActions.replaceValue({ blockPath, value: option })
      }
    },
    [configActions]
  )

  const renderCustomOption = useCallback(
    (_props) => {
      return <CustomOption {..._props} showIcons={showIcons} />
    },
    [block]
  )

  return (
    <div className="block block-select">
      <span className="block__title">{title}</span>
      <span className="block__subtitle">{subtitle}</span>

      {typeof defaultValues !== 'undefined' && (
        <Select
          components={{ Option: renderCustomOption }}
          isMulti={isMulti}
          name={id}
          options={options}
          className="basic-multi-select"
          classNamePrefix="select"
          onChange={handleChange}
          defaultValue={defaultValues}
        />
      )}
      <span className="block__number-options">{flatOptions.length} Option(s)</span>
    </div>
  )
}

export default SelectBlock
