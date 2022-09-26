import './dropdown.scss'

import React from 'react'
import PropTypes from 'prop-types'
import ReactSelect, { components } from 'react-select'
import classNames from 'classnames'

import { TestId } from '@webapp/utils/testId'
import ValidationTooltip from '@webapp/components/validationTooltip'
import { useDropdown } from './useDropdown'

const OptionComponent = (props) => (
  <div data-testid={TestId.dropdown.dropDownItem(props.data?.value)}>
    <components.Option {...props} />
  </div>
)

const IndicatorsContainerComponent = (props) => (
  <div data-testid={TestId.dropdown.toggleBtn(props.selectProps.inputId)}>
    <components.IndicatorsContainer {...props} />
  </div>
)

const Dropdown = (props) => {
  const {
    autocompleteMinChars,
    className,
    clearable,
    disabled,
    id,
    idInput: idInputProp,
    itemLabel,
    itemKey,
    items: itemsProp,
    onBeforeChange,
    onChange: onChangeProp,
    placeholder,
    readOnly,
    readOnlyInput,
    selection,
    testId,
    title,
    validation,
  } = props

  const { inputId, loading, menuIsOpen, onChange, onInputChange, openMenuOnClick, options, selectRef, value } =
    useDropdown({
      autocompleteMinChars,
      idInputProp,
      itemKey,
      itemLabel,
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
        components={{ Option: OptionComponent, IndicatorsContainer: IndicatorsContainerComponent }}
        inputId={inputId}
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
  id: PropTypes.string,
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
  testId: PropTypes.string,
  title: PropTypes.string,
  validation: PropTypes.object,
}

Dropdown.defaultProps = {
  autocompleteMinChars: 0,
  className: undefined,
  clearable: false,
  disabled: false,
  id: null,
  idInput: null,
  itemKey: 'value',
  itemLabel: 'label',
  onBeforeChange: null,
  placeholder: undefined,
  readOnly: false, // TODO: investigate why there are both disabled and readOnly
  readOnlyInput: false,
  selection: null,
  testId: null,
  title: null,
  validation: {},
}

export default Dropdown
