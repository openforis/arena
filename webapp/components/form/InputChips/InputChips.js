import './InputChips.scss'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Dropdown from '../Dropdown'

import { useLocalState, State } from './store'
import Chip from '../chip'

const InputChips = (props) => {
  const {
    className = undefined,
    disabled = false,
    idInput = null,
    itemLabel = 'label',
    itemKey = 'value',
    items,
    minCharactersToAutocomplete = 0,
    onChange = null, // Callback to receive all selection change
    onItemAdd = null, // Callback to receive added item
    onItemRemove = null, // Callback to receive removed item
    placeholder = undefined,
    readOnly = false,
    requiredItems = 0,
    selection = [],
    validation,
  } = props

  const { state, Actions } = useLocalState({
    itemKey,
    itemLabel,
    onChange,
    onItemAdd,
    onItemRemove,
  })

  return (
    <div className={classNames('form-input-chip', className)}>
      {selection.map((item) => (
        <Chip
          key={State.getItemKey(state)(item)}
          label={State.getItemLabel(state)(item)}
          onDelete={() => Actions.removeItem({ selection, state })(item)}
          readOnly={readOnly || selection.length <= requiredItems}
        />
      ))}

      {!readOnly && (
        <Dropdown
          idInput={idInput}
          items={Actions.rejectSelectedItems({ selection, state, items })}
          itemLabel={State.getItemLabel(state)}
          itemValue={State.getItemKey(state)}
          onChange={Actions.onDropdownChange({ selection, state })}
          selection={null}
          minCharactersToAutocomplete={minCharactersToAutocomplete}
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
  className: PropTypes.string,
  idInput: PropTypes.string,

  items: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
  itemLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  itemKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  selection: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string, PropTypes.array]),

  requiredItems: PropTypes.number,
  minCharactersToAutocomplete: PropTypes.number,
  readOnly: PropTypes.bool,
  disabled: PropTypes.bool,
  validation: PropTypes.object,
  placeholder: PropTypes.string,

  onChange: PropTypes.func,
  onItemAdd: PropTypes.func,
  onItemRemove: PropTypes.func,
}

export default InputChips
