import './form.scss'

import React from 'react'

import { TooltipError } from '../tooltip'
import MaskedInput from 'react-text-mask'

export const FormItem = ({label, children}) => (
  <div className="form-item">
    <label className="form-label">{label}</label>
    {children}
  </div>
)

export class Input extends React.Component {

  constructor () {
    super()
    this.input = React.createRef()
  }

  render () {

    const {
      validation,
      disabled,
      mask,
      ...inputProps,
    } = this.props

    return (
      <TooltipError messages={validation.errors}>
        <MaskedInput ref={this.input}
                     mask={mask}
                     className="form-input"
                     aria-disabled={disabled}
                     {...inputProps}
        />


      </TooltipError>
    )
  }

}

Input.defaultProps = {
  validation: {},
  disabled: false,
  mask: false,
}
