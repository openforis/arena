import './InputChips.scss'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { ButtonAdd } from '@webapp/components/buttons'
import ValidationTooltip from '@webapp/components/validationTooltip'

import { SimpleTextInput } from '../SimpleTextInput'

import { useLocalState, State } from './store'
import Chip from '../chip'

const InputChipsText = (props) => {
  const {
    className,
    disabled = false,
    idInput,
    isInputFieldValueValid = () => true,
    minCharactersToAutocomplete = 0,
    onChange = null, // Callback to receive all selection change
    onItemAdd = null, // Callback to receive added item
    onItemRemove = null, // Callback to receive removed item
    placeholder,
    readOnly = false,
    requiredItems = 0,
    selection = [],
    textTransformFunction,
    validation = {},
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
            onDelete={() => Actions.removeItem({ selection, state })(item)}
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
              minCharactersToAutocomplete={minCharactersToAutocomplete}
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

InputChipsText.propTypes = {
  className: PropTypes.string,
  idInput: PropTypes.string,

  selection: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string, PropTypes.array]),

  requiredItems: PropTypes.number,
  minCharactersToAutocomplete: PropTypes.number,
  readOnly: PropTypes.bool,
  disabled: PropTypes.bool,
  validation: PropTypes.object,
  placeholder: PropTypes.string,
  textTransformFunction: PropTypes.func,
  isInputFieldValueValid: PropTypes.func,

  onChange: PropTypes.func,
  onItemAdd: PropTypes.func,
  onItemRemove: PropTypes.func,
}

export default InputChipsText
