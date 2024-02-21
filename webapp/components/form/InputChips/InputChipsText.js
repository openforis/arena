import './InputChips.scss'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { Button } from '@webapp/components/buttons'

import { useLocalState, State } from './store'
import Chip from './Chip'
import { TextInput } from '../TextInput'

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
    onChange,
    onItemAdd,
    onItemRemove,
  } = props

  const { state, Actions } = useLocalState({
    textTransformFunction,
    onChange,
    onItemAdd,
    onItemRemove,
  })

  return (
    <div className={classNames('form-input-chip', className)}>
      {selection.map((item) => (
        <Chip
          key={State.getItemKey(state)(item)}
          item={item}
          itemLabel={State.getItemLabel(state)(item)}
          onDelete={Actions.removeItem({ selection, state })}
          canBeRemoved={selection.length > requiredItems}
          readOnly={readOnly}
        />
      ))}

      {!readOnly && (
        <div>
          <TextInput
            id={idInput}
            onChange={Actions.onInputFieldChange}
            selection={null}
            minCharactersToAutocomplete={minCharactersToAutocomplete}
            disabled={disabled}
            textTransformFunction={textTransformFunction}
            validation={validation}
            value={State.getInputFieldValue(state)}
            placeholder={placeholder}
          />
          <Button
            onClick={() => {
              // onItemAdd(item)
            }}
          />
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
  textTransformFunction: PropTypes.string,

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

  onChange: null, // Callback to receive all selection change
  onItemAdd: null, // Callback to receive added item
  onItemRemove: null, // Callback to receive removed item
}

export default InputChipsText
