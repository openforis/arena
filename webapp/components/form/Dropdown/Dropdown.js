import './dropdown.scss'

import React from 'react'
import PropTypes from 'prop-types'
import ReactSelect, { components } from 'react-select'
import classNames from 'classnames'

import { TestId } from '@webapp/utils/testId'
import ValidationTooltip from '@webapp/components/validationTooltip'
import { LabelWithTooltip } from '../LabelWithTooltip'
import { useDropdown } from './useDropdown'

const OptionComponent = (props) => {
  const { data = {} } = props
  const { description, label, icon, value } = data

  return (
    <div data-testid={TestId.dropdown.dropDownItem(value)}>
      <components.Option {...props}>
        <LabelWithTooltip className="dropdown-option__label" label={label} />
        {description && <span className="dropdown-option__description">{description}</span>}
        {icon && <span className="dropdown-option__icon">{icon}</span>}
      </components.Option>
    </div>
  )
}

const Dropdown = (props) => {
  const {
    minCharactersToAutocomplete,
    className,
    clearable,
    defaultSelection,
    disabled,
    id,
    idInput: idInputProp,
    itemDescription,
    itemIcon,
    itemLabel,
    itemValue,
    items: itemsProp,
    menuPlacement,
    multiple,
    onBeforeChange,
    onChange: onChangeProp,
    placeholder,
    readOnly,
    searchable,
    selection,
    testId,
    title,
    validation,
  } = props

  const {
    defaultValue,
    inputId,
    loading,
    menuIsOpen,
    onChange,
    onInputChange,
    openMenuOnClick,
    options,
    selectRef,
    value,
  } = useDropdown({
    defaultSelection,
    minCharactersToAutocomplete,
    multiple,
    idInputProp,
    itemDescription,
    itemIcon,
    itemLabel,
    itemValue,
    itemsProp,
    onBeforeChange,
    onChangeProp,
    selection,
    title,
  })

  return (
    <ValidationTooltip
      className="dropdown-wrapper dropdown-validation-tooltip"
      id={id}
      testId={testId}
      validation={validation}
    >
      <ReactSelect
        className={classNames('dropdown', className)}
        classNamePrefix="dropdown"
        components={{ Option: OptionComponent }}
        defaultValue={defaultValue}
        inputId={inputId}
        isClearable={clearable && !readOnly}
        isDisabled={disabled}
        isLoading={loading}
        isMulti={multiple}
        isSearchable={searchable && !readOnly}
        onChange={onChange}
        openMenuOnClick={openMenuOnClick}
        menuPlacement={menuPlacement}
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
  minCharactersToAutocomplete: PropTypes.number,
  className: PropTypes.string,
  clearable: PropTypes.bool,
  defaultSelection: PropTypes.any,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  idInput: PropTypes.string,
  itemDescription: PropTypes.oneOfType([PropTypes.string, PropTypes.func]), // item description function or property name
  itemIcon: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  itemLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.func]), // item label function or property name
  itemValue: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  items: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
  menuPlacement: PropTypes.oneOf(['auto', 'top', 'bottom']),
  multiple: PropTypes.bool,
  onBeforeChange: PropTypes.func, // Executed before onChange: if false is returned, onChange is not executed (item cannot be selected)
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  searchable: PropTypes.bool,
  selection: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string]),
  testId: PropTypes.string,
  title: PropTypes.string,
  validation: PropTypes.object,
}

Dropdown.defaultProps = {
  minCharactersToAutocomplete: 0,
  className: undefined,
  clearable: true,
  defaultSelection: undefined,
  disabled: false,
  id: null,
  idInput: null,
  itemDescription: 'description',
  itemIcon: 'icon',
  itemLabel: 'label',
  itemValue: 'value',
  menuPlacement: 'auto',
  multiple: false,
  onBeforeChange: null,
  placeholder: undefined,
  readOnly: false, // TODO: investigate why there are both disabled and readOnly
  searchable: true,
  selection: undefined,
  testId: null,
  title: null,
  validation: {},
}

export default Dropdown
