import React from 'react'
import { TooltipError } from '../tooltip'

class Checkbox extends React.Component {

  render () {

    const {
      validation,
      disabled,
      checked = checked || value === 'true' || value == '1',
      onChange,
      ...inputProps,
    } = this.props

    const {valid = true} = validation

    return (
      <TooltipError message={valid ? null : validation.error}>

        <span className={`icon icon-checkbox-${!checked ? 'un' : ''}checked`}
              style={{cursor: 'pointer'}}
              onClick={() => onChange(!checked)} />

      </TooltipError>
    )
  }
}

Checkbox.defaultProps = {
  checked: false,
  disabled: false,
  validation: {},
}

export default Checkbox