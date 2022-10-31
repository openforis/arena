import './InputChips.scss'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Dropdown from '../Dropdown'

import { useLocalState, State } from './store'
import Chip from './Chip'

const InputChips = (props) => {
  const {
    className,
    idInput,
    items,
    itemKey,
    itemLabel,
    selection,
    requiredItems,
    minCharactersToAutocomplete,
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

InputChips.defaultProps = {
  className: undefined,
  idInput: null,

  itemLabel: 'label',
  itemKey: 'value',
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

export default InputChips
