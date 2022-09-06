import React, { useCallback, useMemo } from 'react'
import * as A from '@core/arena'
import './Checkbox.scss'

const CheckboxBlock = ({ configItemsByPath, configActions, blockPath, block }) => {
  const { title, subtitle, label, id, isRadio = false, defaultValue = false } = block

  const configValues = configItemsByPath?.[blockPath]?.value

  const currentValue = useMemo(
    () => (!A.isEmpty(configValues) ? configValues : defaultValue),
    [configValues, defaultValue]
  )
  const handleChange = useCallback(() => {
    configActions.replaceValue({ blockPath, value: !currentValue })
  }, [blockPath, configActions, currentValue])

  return (
    <div className="block block-checkbox">
      <span className="block__title">{title}</span>
      <span className="block__subtitle">{subtitle}</span>

      <button
        type="button"
        data-testid={id}
        className="btn btn-s btn-transparent btn-checkbox basic-checkbox"
        onClick={handleChange}
        aria-disabled={false}
      >
        <span className={`icon icon-${isRadio ? 'radio' : 'checkbox'}-${!currentValue ? 'un' : ''}checked icon-18px`} />
        <span className="checkbox-label">{label}</span>
      </button>
    </div>
  )
}

export default CheckboxBlock
