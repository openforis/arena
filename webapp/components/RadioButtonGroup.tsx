import './RadioButtonGroup.scss'

import { useCallback } from 'react'
import { RadioGroup } from '@mui/material'
import classNames from 'classnames'

import { RadioButton } from './RadioButton'

type RadioButtonGroupProps = {
  className?: string
  items: any[]
  onChange: (...args: any[]) => any
  row?: boolean
  value?: string
}

export const RadioButtonGroup = (props: RadioButtonGroupProps) => {
  const { className, items, onChange: onChangeProp, row = false, value } = props

  const onChange = useCallback((e) => onChangeProp(e.target.value), [onChangeProp])

  return (
    <RadioGroup className={classNames('radio-button-group', className)} onChange={onChange} row={row} value={value}>
      {items.map((item) => {
        const { key, disabled, label, labelParams } = item
        return <RadioButton key={key} value={key} label={label} labelParams={labelParams} disabled={disabled} />
      })}
    </RadioGroup>
  )
}
