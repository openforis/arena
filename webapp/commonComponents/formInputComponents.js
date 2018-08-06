import './form.scss'

import React from 'react'

import { TooltipError } from './tooltipComponent'

export const FormItemComponent = ({label, children}) => (
  <div className="form-item">
    <label className="form-label">{label}</label>
    {children}
  </div>
)

export class FormInput extends React.Component {

  render () {

    const {
      validation = {},
      disabled = false,
      ...inputProps,
    } = this.props

    const {valid = true} = validation

    return (
      <TooltipError message={valid ? null : validation.error}>

        <input className={`form-input ${valid ? '' : ' error'}`}
               ref="input"
               aria-disabled={disabled}
               {...inputProps}/>

      </TooltipError>
    )
  }

}

