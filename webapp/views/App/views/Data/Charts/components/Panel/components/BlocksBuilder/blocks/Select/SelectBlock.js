import React, { useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'

import { uuidv4 } from '@core/uuid'

import { Dropdown } from '@webapp/components/form'
import * as NodeDefUIProps from '@webapp/components/survey/SurveyForm/nodeDefs/nodeDefUIProps'
import { NodeDefType } from '@openforis/arena-core'

const icons = {
  quantitative: NodeDefUIProps.getIconByType(NodeDefType.decimal),
  nominal: NodeDefUIProps.getIconByType(NodeDefType.text),
  temporal: NodeDefUIProps.getIconByType(NodeDefType.time),
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

  return (
    <div className="block block-select">
      <span className="block__title">{title}</span>
      <span className="block__subtitle">{subtitle}</span>

      {typeof defaultValues !== 'undefined' && (
        <Dropdown
          className="basic-multi-select"
          itemIcon={(item) => (showIcons ? icons[item.type] : null)}
          items={options}
          menuPosition="absolute"
          multiple={isMulti}
          name={id}
          onChange={handleChange}
          defaultSelection={defaultValues}
        />
      )}
    </div>
  )
}

SelectBlock.propTypes = {
  configItemsByPath: PropTypes.object.isRequired,
  configActions: PropTypes.object.isRequired,
  blockPath: PropTypes.string.isRequired,
  dimensions: PropTypes.array.isRequired,
  block: PropTypes.object.isRequired,
  onChange: PropTypes.func,
  values: PropTypes.object,
}

export default SelectBlock
