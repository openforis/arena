import './form.scss'

import React from 'react'

import { TooltipError } from './tooltip'

export class FormInput extends React.Component {

  render () {

    const {
      type = 'input',
      value,
      placeholder,
      onChange,
      validation = {}
    } = this.props

    const {valid = true} = validation

    return (
      <TooltipError message={valid ? null : validation.error}>
        <input type={type}
               className={`form-input ${valid ? '' : ' error'}`}
               value={value}
               placeholder={placeholder}
               onChange={onChange}
               ref="input"/>
      </TooltipError>
    )
  }

}

