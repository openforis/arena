import React from 'react'
import ValidationTooltip from '../validationTooltip'

class Checkbox extends React.Component {
  static defaultProps = {
    checked: false,
    disabled: false,
    radio: false,
    validation: {},
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
      <div style={{ justifySelf: 'start' }}>
        <ValidationTooltip validation={validation} className={null} showKeys={null}>

          <button className="btn btn-s btn-transparent btn-checkbox"
                  onClick={() => onChange(!checked)}
                  aria-disabled={disabled}>
            <span className={`icon icon-${radio ? 'radio' : 'checkbox'}-${!checked ? 'un' : ''}checked icon-18px`}/>
            {label}
          </button>

        </ValidationTooltip>
      </div>
    )
  }
}

export default Checkbox
