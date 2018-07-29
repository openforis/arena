import './form.scss'

import React from 'react'

import { TooltipError } from './tooltip'

export const FormInput = (props) => {
  const {
    type = 'input',
    value,
    placeholder,
    onChange,
    validation = {}
  } = props

  const {valid = true} = validation

  return (
    <TooltipError message={valid ? null : validation.error}>
      <input type={type}
             className={`form-input ${valid ? '' : ' error'}`}
             value={value}
             placeholder={placeholder}
             onChange={onChange}/>
    </TooltipError>
  )
}

