import './InputChips.scss'

import React from 'react'
import PropTypes from 'prop-types'

import Dropdown from '../Dropdown'

import { useLocalState, State } from './store'
import Chip from './Chip'

const InputChips = (props) => {
  const {
    idInput,
    items,
    itemKey,
    itemLabel,
    selection,
    requiredItems,
    autocompleteMinChars,
    readOnly,
    disabled,
    validation,
    placeholder,
    onChange,
    onItemAdd,
    onItemRemove,
  } = props

  const { state, Actions } = useLocalState({
    itemKey,
    itemLabel,
    onChange,
    onItemAdd,
    onItemRemove,
  })

  return (
    <div className="form-input-chip">
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
        <Dropdown
          idInput={idInput}
          items={Actions.rejectSelectedItems({ selection, state, items })}
          itemKey={State.getItemKey(state)}
          itemLabel={State.getItemLabel(state)}
          onChange={Actions.onDropdownChange({ selection, state })}
          selection={null}
          autocompleteMinChars={autocompleteMinChars}
          readOnly={readOnly}
          disabled={disabled}
          validation={validation}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

InputChips.propTypes = {
  idInput: PropTypes.string,

  items: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
  itemLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  itemKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  selection: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string, PropTypes.array]),

  requiredItems: PropTypes.number,
  autocompleteMinChars: PropTypes.number,
  readOnly: PropTypes.bool,
  disabled: PropTypes.bool,
  validation: PropTypes.object,
  placeholder: PropTypes.string,

  onChange: PropTypes.func,
  onItemAdd: PropTypes.func,
  onItemRemove: PropTypes.func,
}

InputChips.defaultProps = {
  idInput: null,

  itemLabel: 'value',
  itemKey: 'key',
  selection: [],
  requiredItems: 0,
  autocompleteMinChars: 0,
  readOnly: false,
  disabled: false,
  validation: {},
  placeholder: null,

  onChange: null, // Callback to receive all selection change
  onItemAdd: null, // Callback to receive added item
  onItemRemove: null, // Callback to receive removed item
}

export default InputChips
