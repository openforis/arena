import React, { useCallback } from 'react'

import './Slider.scss'

const SliderBlock = ({ config, configItemsByPath, configActions, blockPath, dimensions, block }) => {
  const { params, title, subtitle, id } = block

  const handleChange = useCallback(
    (e) => {
      configActions.replaceValue({ blockPath, value: e.target.value })
    },
    [blockPath, configActions]
  )

  return (
    <div className="block block-input">
      <span className="block__title">{title}</span>
      <span className="block__subtitle">{subtitle}</span>
      <input
        type="range"
        id={id}
        className="basic-input"
        defaultValue={params?.default}
        min={params?.min}
        max={params?.max}
        onChange={handleChange}
      />
    </div>
  )
}

export default SliderBlock
