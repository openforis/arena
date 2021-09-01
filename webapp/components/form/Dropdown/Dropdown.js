import './dropdown.scss'
import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import classNames from 'classnames'

import { DataTestId } from '@webapp/utils/dataTestId'

import { Input } from '@webapp/components/form/Input'
import AutocompleteDialog from '@webapp/components/form/AutocompleteDialog'

import ItemDialog from './ItemDialog'
import { useLocalState, State } from './store'

const Dropdown = (props) => {
  const {
    autocompleteDialogClassName,
    autocompleteMinChars,
    className,
    disabled,
    idInput,
    itemLabel,
    itemKey,
    items,
    onBeforeChange,
    onChange,
    placeholder,
    readOnly,
    readOnlyInput,
    selection,
    sourceElement,
    title,
    validation,
  } = props

  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  const { state, Actions } = useLocalState({
    autocompleteMinChars,
    disabled,
    itemKey,
    itemLabel,
    items,
    onBeforeChange,
    onChange,
    readOnly,
    selection,
    title,
  })
  const showDialog = State.getShowDialog(state)
  const itemsDialog = State.getItemsDialog(state)
  const inputValue = State.getInputValue(state) || ''

  const searchMinCharsReached = autocompleteMinChars <= 0 || inputValue.trim().length >= autocompleteMinChars

  return (
    <div
      ref={dropdownRef}
      className={classNames('dropdown', className)}
      onBlur={(event) => {
        const { className: classNameTarget = '' } = event.relatedTarget || {}
        if (classNameTarget !== ItemDialog.className) {
          Actions.closeDialog({ selection, state })
        }
      }}
    >
      <Input
        id={idInput}
        ref={inputRef}
        placeholder={placeholder}
        value={inputValue}
        validation={validation}
        readOnly={readOnly || readOnlyInput}
        disabled={disabled}
        onChange={async (value) => {
          await Actions.updateInputValue({ value, state })
        }}
        onBlur={async (e) => {
          await Actions.onBlurInput({ value: e.target.value, state, selection })
        }}
        onFocus={async () => Actions.openDialog({ state })}
        title={title}
      />

      <button
        type="button"
        className="btn-s btn-transparent btn-toggle"
        data-testid={idInput ? DataTestId.dropdown.toggleBtn(idInput) : null}
        onClick={async (event) => {
          event.preventDefault()
          event.stopPropagation()
          if (showDialog) Actions.closeDialog({ selection, state })
          else await Actions.openDialog({ state })
        }}
        aria-disabled={disabled || !searchMinCharsReached}
      >
        <span className="icon icon-play3 icon-12px" />
      </button>

      {showDialog &&
        ReactDOM.createPortal(
          <AutocompleteDialog
            className={autocompleteDialogClassName}
            inputField={inputRef.current}
            itemLabel={State.getItemLabel(state)}
            itemKey={State.getItemKey(state)}
            itemRenderer={ItemDialog}
            items={itemsDialog}
            onItemSelect={async (item) => {
              await Actions.updateSelection({ item, selection, state })
            }}
            onClose={() => {
              Actions.closeDialog({ selection, state })
            }}
            sourceElement={sourceElement || dropdownRef.current}
          />,
          document.body
        )}
    </div>
  )
}

Dropdown.propTypes = {
  autocompleteDialogClassName: PropTypes.string,
  autocompleteMinChars: PropTypes.number,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  idInput: PropTypes.string,
  itemLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  itemKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  items: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
  onBeforeChange: PropTypes.func, // Executed before onChange: if false is returned, onChange is not executed (item cannot be selected)
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  readOnlyInput: PropTypes.bool,
  selection: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string]),
  sourceElement: PropTypes.object, // Used to calculate the size of the autocomplete-dialog if available, otherwise the dropdownRef.current is used
  title: PropTypes.string,
  validation: PropTypes.object,
}

Dropdown.defaultProps = {
  autocompleteDialogClassName: null,
  autocompleteMinChars: 0,
  className: '',
  disabled: false,
  idInput: null,
  itemKey: 'key',
  itemLabel: 'value',
  onBeforeChange: null,
  placeholder: '',
  readOnly: false, // TODO: investigate why there are both disabled and readOnly
  readOnlyInput: false,
  selection: null,
  sourceElement: null,
  title: null,
  validation: {},
}

export default Dropdown
