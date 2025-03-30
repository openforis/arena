import './InputSwitch.scss'
import React from 'react'
import ReactSwitch from 'react-switch'
import PropTypes from 'prop-types'

const InputSwitch = (props) => {
  const { checked, disabled = false, onChange } = props

  return (
    <ReactSwitch
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      width={40}
      height={20}
      onColor="#84ac67"
      offColor="#d1d1dd"
      checkedIcon={
        <div className="input-switch__icon">
          <span className="icon icon-checkmark icon-10px" />
        </div>
      }
      uncheckedIcon={
        <div className="input-switch__icon">
          <span className="icon icon-cross icon-8px" />
        </div>
      }
    />
  )
}

InputSwitch.propTypes = {
  checked: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
}

export default InputSwitch
