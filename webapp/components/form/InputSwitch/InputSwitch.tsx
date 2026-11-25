import './InputSwitch.scss'

import ReactSwitch from 'react-switch'

type InputSwitchProps = {
  checked: boolean
  disabled?: boolean
  onChange: (...args: any[]) => any
}

const InputSwitch = (props: InputSwitchProps) => {
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

export default InputSwitch
