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
      validation = {},
      disabled = false,
      mask = false,
      ...inputProps,
    } = this.props

    const {valid = true} = validation

    return (
      <TooltipError message={valid ? null : validation.error}>
        <MaskedInput ref={this.input}
                     mask={mask}
                     className={`form-input ${valid ? '' : ' error'}`}
                     {...inputProps}
        />


      </TooltipError>
    )
  }

}

/**

 <input className={`form-input ${valid ? '' : ' error'}`}
 ref="input"
 aria-disabled={disabled}
 {...inputProps}/>

 */