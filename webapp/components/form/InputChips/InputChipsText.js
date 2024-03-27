import './InputChips.scss'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { ButtonAdd } from '@webapp/components/buttons'
import ValidationTooltip from '@webapp/components/validationTooltip'

import { TextInput } from '../TextInput'

import Chip from './Chip'
import { State, useLocalState } from './store'

const InputChipsText = (props) => {
  const {
    className,
    idInput,
    selection,
    requiredItems,
    minCharactersToAutocomplete,
    readOnly,
    disabled,
    validation,
    placeholder,
    textTransformFunction,
    isInputFieldValueValid,
    onChange,
    onItemAdd,
    onItemRemove,
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
            item={item}
            itemLabel={State.getItemLabel(state)(item)}
            onDelete={Actions.removeItem({ selection, state })}
            canBeRemoved={selection.length > requiredItems}
            readOnly={readOnly}
          />
        ))}
      </div>
      {!readOnly && (
        <div className="input-field-row">
          <ValidationTooltip validation={validation}>
            <TextInput
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

InputChipsText.defaultProps = {
  className: undefined,
  idInput: null,

  selection: [],
  requiredItems: 0,
  minCharactersToAutocomplete: 0,
  readOnly: false,
  disabled: false,
  validation: {},
  placeholder: undefined,
  isInputFieldValueValid: () => true,

  onChange: null, // Callback to receive all selection change
  onItemAdd: null, // Callback to receive added item
  onItemRemove: null, // Callback to receive removed item
}

export default InputChipsText
