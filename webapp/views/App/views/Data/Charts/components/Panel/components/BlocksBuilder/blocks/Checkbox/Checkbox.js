import React, { useCallback } from 'react'

import './Checkbox.scss'

const CheckboxBlock = ({ configItemsByPath, configActions, blockPath, block }) => {
  const { title, subtitle, id } = block

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
        defaultValue={configItemsByPath?.[blockPath]?.value}
        onChange={handleChange}
      />
    </div>
  )
}

export default CheckboxBlock
