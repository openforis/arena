import './InputChips.scss'

import classNames from 'classnames'

import { ButtonAdd } from '@webapp/components/buttons'
import ValidationTooltip from '@webapp/components/ValidationTooltip'

import { SimpleTextInput } from '../SimpleTextInput'

import { useLocalState, State } from './store'
import Chip from '../Chip'
import type { ArenaValidation } from '@openforis/arena-core'

type InputChipsTextProps = {
  className?: string
  idInput?: string
  selection?: any[]
  requiredItems?: number
  readOnly?: boolean
  disabled?: boolean
  validation?: ArenaValidation
  placeholder?: string
  textTransformFunction?: (...args: any[]) => any
  isInputFieldValueValid?: (...args: any[]) => any
  onChange?: (...args: any[]) => any
  onItemAdd?: (...args: any[]) => any
  onItemRemove?: (...args: any[]) => any
}

const InputChipsText = (props: InputChipsTextProps) => {
  const {
    className,
    disabled = false,
    idInput,
    isInputFieldValueValid = () => true,
    onChange = null, // Callback to receive all selection change
    onItemAdd = null, // Callback to receive added item
    onItemRemove = null, // Callback to receive removed item
    placeholder,
    readOnly = false,
    requiredItems = 0,
    selection = [],
    textTransformFunction,
    validation,
  } = props

  const { state, Actions } = useLocalState({
    isInputFieldValueValid,
    textTransformFunction,
    onChange,
    onItemAdd,
    onItemRemove,
  })

  const canAddItem = State.canAddItem(state)

  return (
    <div className={classNames('form-input-chip-text', className)}>
      <div className="chips-wrapper">
        {selection.map((item) => (
          <Chip
            key={item}
            label={State.getItemLabel(state)(item)}
            onDelete={() => Actions.removeItem({ selection })(item)}
            readOnly={readOnly || selection.length <= requiredItems}
          />
        ))}
      </div>
      {!readOnly && (
        <div className="input-field-row">
          <ValidationTooltip validation={validation}>
            <SimpleTextInput
              id={idInput}
              onChange={Actions.onInputFieldChange({ selection })}
              onBlur={() => {
                if (canAddItem) Actions.onItemAddClick({ selection })
              }}
              disabled={disabled}
              textTransformFunction={textTransformFunction}
              value={State.getInputFieldValue(state)}
              placeholder={placeholder}
            />
          </ValidationTooltip>
          <ButtonAdd disabled={!canAddItem} onClick={() => Actions.onItemAddClick({ selection })} />
        </div>
      )}
    </div>
  )
}

export default InputChipsText
