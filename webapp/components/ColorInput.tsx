import './ColorInput.scss'

import { MuiColorInput } from 'mui-color-input'

import { ButtonIconClose } from './buttons'

type ColorInputProps = {
  disabled?: boolean
  onChange: (...args: any[]) => any
  value?: string
}

export const ColorInput = (props: ColorInputProps) => {
  const { disabled = false, onChange, value = '' } = props

  const onClear = () => onChange('')

  return (
    <div className="color-input">
      <MuiColorInput
        key={value ? 'filled' : 'empty'}
        disabled={disabled}
        format="hex"
        isAlphaHidden
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

export default ColorInput
