import './form.scss'

import React from 'react'

import { TooltipError } from './tooltip'

export class FormInput extends React.Component {

  render () {

    const {
      validation = {},
      ...inputProps,
    } = this.props

    const {valid = true} = validation

    return (
      <TooltipError message={valid ? null : validation.error}>

        <input className={`form-input ${valid ? '' : ' error'}`}
               ref="input"
               {...inputProps}/>

      </TooltipError>
    )
  }

}

