import './InputChips.scss'

import classNames from 'classnames'

import type { ArenaValidation } from '@openforis/arena-core'

import Chip from '../Chip'
import Dropdown from '../Dropdown'

import { State, useLocalState } from './store'

type InputChipsProps = {
  className?: string
  idInput?: string
  items: any[] | ((...args: any[]) => any)
  itemLabel?: string | ((...args: any[]) => any)
  itemKey?: string | ((...args: any[]) => any)
  selection?: any[]
  requiredItems?: number
  minCharactersToAutocomplete?: number
  readOnly?: boolean
  disabled?: boolean
  validation?: ArenaValidation
  placeholder?: string
  onChange?: (...args: any[]) => any
  onItemAdd?: (...args: any[]) => any
  onItemRemove?: (...args: any[]) => any
}

const InputChips = (props: InputChipsProps) => {
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
          onDelete={() => Actions.removeItem({ selection })(item)}
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

export default InputChips
