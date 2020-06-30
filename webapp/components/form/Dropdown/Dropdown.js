import './dropdown.scss'
import React, { memo, useRef } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import classNames from 'classnames'

import * as A from '@core/arena'

import { Input } from '@webapp/components/form/input'
import AutocompleteDialog from '@webapp/components/form/autocompleteDialog'

import ItemDialog from './ItemDialog'
import { useDropdown } from './store'

const Dropdown = (props) => {
  const {
    autocompleteDialogClassName,
    autocompleteMinChars,
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

  const dropdown = useDropdown({
    autocompleteMinChars,
    disabled,
    inputRef,
    itemKey,
    itemLabel,
    items,
    readOnly,
    onBeforeChange,
    onChange,
    selection,
  })
  const { Actions, inputValue, itemsDialog, showDialog, getItemKey, getItemLabel } = dropdown

  return (
    <div
      ref={dropdownRef}
      className={classNames('dropdown', className)}
      onBlur={(event) => {
        const { className: classNameTarget = [] } = event.relatedTarget || {}
        if (showDialog && classNameTarget !== ItemDialog.className) {
          Actions.toggleDialog()
        }
      }}
    >
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={inputValue}
        validation={validation}
        readOnly={readOnly || readOnlyInput}
        disabled={disabled}
        onChange={(value) => Actions.updateInputValue({ value })}
        onFocus={() => {
          if (!showDialog && !A.isEmpty(itemsDialog)) {
            Actions.toggleDialog()
          }
        }}
      />

      <button
        type="button"
        className="btn-s btn-transparent btn-toggle"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          Actions.toggleDialog()
        }}
        aria-disabled={disabled}
      >
        <span className="icon icon-play3 icon-12px" />
      </button>

      {showDialog &&
        ReactDOM.createPortal(
          <AutocompleteDialog
            className={autocompleteDialogClassName}
            inputField={inputRef.current}
            itemLabel={getItemLabel}
            itemKeyFunction={getItemKey}
            itemRenderer={ItemDialog}
            items={itemsDialog}
            onItemSelect={Actions.updateSelection}
            onClose={Actions.toggleDialog}
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
  itemLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  itemKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  items: PropTypes.oneOfType([PropTypes.array.isRequired, PropTypes.func]).isRequired,
  onBeforeChange: PropTypes.func, // Executed before onChange: if false is returned, onChange is not executed (item cannot be selected)
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  readOnlyInput: PropTypes.bool,
  selection: PropTypes.object,
  sourceElement: PropTypes.object, // Used to calculate the size of the autocomplete-dialog if available, otherwise the dropdownRef.current is used
  validation: PropTypes.object,
}

Dropdown.defaultProps = {
  autocompleteDialogClassName: null,
  autocompleteMinChars: 0,
  className: '',
  disabled: false,
  itemKey: 'key',
  itemLabel: 'value',
  onBeforeChange: null,
  placeholder: '',
  readOnly: false, // TODO: investigate why there are both disabled and readOnly
  readOnlyInput: false,
  selection: null,
  sourceElement: null,
  validation: {},
}

export default memo(Dropdown)
