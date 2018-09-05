import React from 'react'
import { TooltipError } from '../tooltip'

class Checkbox extends React.Component {

  render () {

    const {
      validation,
      checked,
      onChange,
      disabled = false,
    } = this.props

    const {valid = true} = validation

    return (
      <div style={{justifySelf: 'start'}}>
        <TooltipError message={valid ? null : validation.error}>

          <button className="btn btn-s btn-transparent"
                  onClick={() => onChange(!checked)}
                  aria-disabled={disabled}>
            <span className={`icon icon-checkbox-${!checked ? 'un' : ''}checked icon-24px`}/>
          </button>

        </TooltipError>
      </div>
    )
  }
}

Checkbox.defaultProps = {
  checked: false,
  disabled: false,
  validation: {},
}

export default Checkbox