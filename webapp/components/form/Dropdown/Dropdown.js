import './dropdown.scss'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import ReactSelect from 'react-select'
import classNames from 'classnames'

import * as A from '@core/arena'
import ValidationTooltip from '@webapp/components/validationTooltip'

const Dropdown = (props) => {
  const {
    autocompleteMinChars,
    className,
    clearable,
    disabled,
    idInput,
    itemLabel,
    itemKey,
    items: itemsProp,
    onBeforeChange,
    onChange: onChangeProp,
    placeholder,
    readOnly,
    readOnlyInput,
    selection,
    style,
    title,
    validation,
  } = props

  const selectRef = useRef(null)
  const inputValue = selectRef?.current?.inputRef?.value
  const searchMinCharsReached = !autocompleteMinChars || autocompleteMinChars <= inputValue?.trim()?.length

  const getOptionLabel = useCallback(
    (item) => (itemLabel.constructor === String ? A.prop(itemLabel, item) : itemLabel(item)),
    [itemLabel]
  )

  const getOptionValue = useCallback(
    (item) => (itemKey.constructor === String ? A.prop(itemKey, item) : itemKey(item)),
    [itemKey]
  )

  const [state, setState] = useState({ items: [], loading: false })

  const { items, loading } = state

  const fetchItems = useCallback(async () => {
    if (!loading) {
      setState({ items: [], loading: true })
    }
    const _items = itemsProp ? (Array.isArray(itemsProp) ? itemsProp : await itemsProp(inputValue)) : []
    setState({ items: _items, loading: false })
  }, [itemsProp, loading, inputValue])

  useEffect(() => {
    if (searchMinCharsReached) {
      fetchItems()
    }
  }, [])

  const getItemFromOption = useCallback(
    (option) => (option ? items.find((itm) => getOptionValue(itm) === option.value) : null),
    [items, getOptionValue]
  )

  const onChange = useCallback(
    async (option) => {
      const item = getItemFromOption(option)
      if (!onBeforeChange || (await onBeforeChange(item))) {
        onChangeProp(item)
      }
    },
    [getItemFromOption, onBeforeChange, onChangeProp]
  )

  const onInputChange = useCallback(
    (inputValue) => {
      if (autocompleteMinChars) {
        if (autocompleteMinChars <= inputValue?.length) {
          fetchItems()
        } else {
          setState({ items: [] })
        }
      }
    },
    [autocompleteMinChars, fetchItems]
  )

  const options = items?.map((item) => ({ value: getOptionValue(item), label: getOptionLabel(item) }))

  const emptySelection = A.isEmpty(selection)
  const selectedValue = emptySelection ? null : getOptionValue(selection)
  const value = emptySelection ? null : options.find((option) => option.value === selectedValue)

  // prevent menu opening when readOnly is true
  const openMenuOnClick = !readOnly && searchMinCharsReached
  const menuIsOpen = readOnly || !searchMinCharsReached ? false : undefined

  return (
    <ValidationTooltip key={`validation-${idInput}`} validation={validation} className="dropdown-validation-tooltip">
      <ReactSelect
        className={classNames('dropdown', className)}
        classNamePrefix="dropdown"
        inputId={idInput}
        isClearable={clearable && !readOnly}
        isDisabled={disabled}
        isLoading={loading}
        isSearchable={!readOnlyInput && !readOnly}
        onChange={onChange}
        openMenuOnClick={openMenuOnClick}
        menuIsOpen={menuIsOpen}
        onInputChange={onInputChange}
        options={options}
        placeholder={placeholder}
        ref={selectRef}
        value={value}
      />
    </ValidationTooltip>
  )
}

Dropdown.propTypes = {
  autocompleteMinChars: PropTypes.number,
  className: PropTypes.string,
  clearable: PropTypes.bool,
  disabled: PropTypes.bool,
  idInput: PropTypes.string,
  itemLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]), // item label function or property name
  itemKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  items: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
  onBeforeChange: PropTypes.func, // Executed before onChange: if false is returned, onChange is not executed (item cannot be selected)
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  readOnlyInput: PropTypes.bool,
  selection: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string]),
  style: PropTypes.object,
  title: PropTypes.string,
  validation: PropTypes.object,
}

Dropdown.defaultProps = {
  autocompleteMinChars: 0,
  className: undefined,
  clearable: false,
  disabled: false,
  idInput: null,
  itemKey: 'value',
  itemLabel: 'label',
  onBeforeChange: null,
  placeholder: undefined,
  readOnly: false, // TODO: investigate why there are both disabled and readOnly
  readOnlyInput: false,
  selection: null,
  style: {},
  title: null,
  validation: {},
}

export default Dropdown
