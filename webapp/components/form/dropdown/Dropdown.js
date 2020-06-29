import './dropdown.scss'
import React, { useRef } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import classNames from 'classnames'

import { Input } from '@webapp/components/form/input'
import AutocompleteDialog from '@webapp/components/form/autocompleteDialog'

import ItemDialog from './ItemDialog'
import { useDropdown } from './store'

const Dropdown = (props) => {
  const {
    autocompleteDialogClassName,
    className,
    disabled,
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
    validation,
  } = props

  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  const dropdown = useDropdown({ disabled, itemKey, itemLabel, readOnly, onBeforeChange, onChange, selection })
  const { Actions, inputValue, opened, getItemKey, getItemLabel, toggleOpened } = dropdown

  return (
    <div ref={dropdownRef} className={classNames('dropdown', className)} onBlur={() => {}}>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={inputValue}
        validation={validation}
        readOnly={readOnly || readOnlyInput}
        disabled={disabled}
        // onChange={(value) => this.onInputChange(value)}
        // onFocus={(e) => this.onInputFocus(e)}
      />

      <button
        type="button"
        className="btn-s btn-transparent btn-toggle"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          toggleOpened()
        }}
        aria-disabled={disabled}
      >
        <span className="icon icon-play3 icon-12px" />
      </button>

      {opened &&
        ReactDOM.createPortal(
          <AutocompleteDialog
            className={autocompleteDialogClassName}
            inputField={inputRef.current}
            itemLabel={getItemLabel}
            itemKeyFunction={getItemKey}
            itemRenderer={ItemDialog}
            items={items}
            onItemSelect={Actions.updateSelection}
            onClose={toggleOpened}
            sourceElement={sourceElement || dropdownRef.current}
          />,
          document.body
        )}
    </div>
  )
}

Dropdown.propTypes = {
  // autocompleteMinChars: PropTypes.number,
  autocompleteDialogClassName: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  itemLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  itemKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  items: PropTypes.array.isRequired,
  // itemsLookupFunction: PropTypes.func,
  onBeforeChange: PropTypes.func, // Executed before onChange: if false is returned, onChange is not executed (item cannot be selected)
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  readOnlyInput: PropTypes.bool,
  selection: PropTypes.object,
  sourceElement: PropTypes.element, // Used to calculate the size of the autocomplete-dialog if available, otherwise the dropdownRef.current is used
  validation: PropTypes.object,
}

Dropdown.defaultProps = {
  // autocompleteMinChars: 0,
  autocompleteDialogClassName: null,
  className: '',
  disabled: false,
  itemKey: 'key',
  itemLabel: 'value',
  // itemsLookupFunction: null,
  // TODO: remove items: [],
  onBeforeChange: null,
  // TODO: onChange: null,
  placeholder: '',
  readOnly: false, // TODO: investigate why there are both disabled and readOnly
  readOnlyInput: false,
  selection: null,
  sourceElement: null,
  validation: {},
}

export default Dropdown
