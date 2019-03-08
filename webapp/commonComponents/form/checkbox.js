import React from 'react'
import Tooltip from '../tooltip'

class Checkbox extends React.Component {

  render () {

    const {
      validation,
      checked,
      label,
      onChange,
      disabled,
      radio,
    } = this.props

    return (
      <div style={{ justifySelf: 'start' }}>
        <Tooltip messages={validation.errors} type={validation.errors ? 'error' : ''}>

          <button className="btn btn-s btn-transparent btn-checkbox"
                  onClick={() => onChange(!checked)}
                  aria-disabled={disabled}>
            <span className={`icon icon-${radio ? 'radio' : 'checkbox'}-${!checked ? 'un' : ''}checked icon-24px`}/>
            {label}
          </button>

        </Tooltip>
      </div>
    )
  }
}

Checkbox.defaultProps = {
  checked: false,
  disabled: false,
  radio: false,
  validation: {},
}

export default Checkbox