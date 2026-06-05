import './ColorInput.scss'

import PropTypes from 'prop-types'
import { MuiColorInput } from 'mui-color-input'

import { ButtonIconClose } from './buttons'

export const ColorInput = (props) => {
  const { disabled = false, onChange, value = '' } = props

  const onClear = () => onChange('')

  return (
    <div className="color-input">
      <MuiColorInput
        disabled={disabled}
        format="hex"
        slotProps={{
          input: { readOnly: true },
        }}
        value={value}
        onChange={onChange}
      />
      {value && <ButtonIconClose disabled={disabled} label="common.clear" onClick={onClear} />}
    </div>
  )
}

ColorInput.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
}

export default ColorInput
