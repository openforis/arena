import React, { useCallback } from 'react'

import Select from 'react-select'
import './Input.scss'

const InputBlock = ({ dimensions, block, spec, onUpdateSpec }) => {
  const { title, subtitle, blocks, order, type, id } = block

  const handleChange = useCallback(
    (dimensionsSelected) => {
      const [dimension] = dimensionsSelected
      block.onUpdateSpec({ spec, onUpdateSpec })({ dimension })
    },
    [spec, onUpdateSpec]
  )
  return (
    <div className="block block-input">
      <span className="block-input__title">{title}</span>
      <span className="block-input__subtitle">{subtitle}</span>

      <Select
        isMulti
        name={id}
        options={dimensions}
        className="basic-multi-select"
        classNamePrefix="select"
        onChange={handleChange}
      />
    </div>
  )
}

export default InputBlock
