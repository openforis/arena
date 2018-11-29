import React from 'react'
import { TooltipError } from '../tooltip'

class Checkbox extends React.Component {

  constructor (props) {
    super(props)
  }

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
      <div style={{justifySelf: 'start'}}>
        <TooltipError messages={validation.errors}>

          <button className="btn btn-s btn-transparent btn-checkbox"
                  onClick={() => onChange(!checked)}
                  aria-disabled={disabled}>
            <span className={`icon icon-${radio ? 'radio' : 'checkbox'}-${!checked ? 'un' : ''}checked icon-24px`}/>
            {label}
          </button>

        </TooltipError>
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