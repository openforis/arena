import './dropdown.scss'

import { useMemo } from 'react'
import classNames from 'classnames'
import ReactSelect, { components, createFilter } from 'react-select'

import type { ArenaValidation } from '@openforis/arena-core'

import ValidationTooltip from '@webapp/components/ValidationTooltip'
import { TestId } from '@webapp/utils/testId'
import { LabelWithTooltip } from '../LabelWithTooltip'

import { dropdownTheme } from './dropdownTheme'
import { useDropdown } from './useDropdown'

const OptionComponent =
  ({ renderOptionLabel }) =>
  (reactSelectProps) => {
    const { data = {} } = reactSelectProps
    const { description, label, icon, value } = data

    return (
      <div data-testid={TestId.dropdown.dropDownItem(value)}>
        <components.Option {...reactSelectProps}>
          {renderOptionLabel ? (
            renderOptionLabel({ data })
          ) : (
            <LabelWithTooltip className="dropdown-option__label" label={label} />
          )}
          {description && <span className="dropdown-option__description">{description}</span>}
          {icon && <span className="dropdown-option__icon">{icon}</span>}
        </components.Option>
      </div>
    )
  }

const SingleValueComponent =
  ({ renderSelectedLabel }) =>
  (reactSelectProps) => {
    const { children: childrenProp, data, ...otherProps } = reactSelectProps
    const children = childrenProp && typeof childrenProp === 'string' ? childrenProp.trim() : childrenProp
    return (
      <components.SingleValue data={data} {...otherProps}>
        {renderSelectedLabel ? renderSelectedLabel({ data }) : <LabelWithTooltip label={children} />}
      </components.SingleValue>
    )
  }

type DropdownProps = {
  ariaLabel?: string
  className?: string
  clearable?: boolean
  defaultSelection?: any
  disabled?: boolean
  id?: string
  idInput?: string
  itemDescription?: string | ((...args: any[]) => any) // item description function or property name
  itemIcon?: string | ((...args: any[]) => any)
  itemLabel?: string | ((...args: any[]) => any) // item label function or property name
  itemValue?: string | ((...args: any[]) => any)
  items: any[] | ((...args: any[]) => any)
  loading?: boolean
  menuPlacement?: 'auto' | 'top' | 'bottom'
  menuPosition?: 'absolute' | 'fixed'
  minCharactersToAutocomplete?: number
  multiple?: boolean
  onBeforeChange?: (...args: any[]) => any // Executed before onChange: if false is returned, onChange is not executed (item cannot be selected)
  onChange: (...args: any[]) => any
  placeholder?: string
  readOnly?: boolean
  renderOptionLabel?: (...args: any[]) => any
  renderSelectedLabel?: (...args: any[]) => any // renders the selected item (single selection only)
  searchable?: boolean
  selection?: Record<string, any> | number | string | any[]
  testId?: string
  title?: string
  validation?: ArenaValidation
  validationTooltipPosition?: 'bottom' | 'top'
}

const Dropdown = (props: DropdownProps) => {
  const {
    ariaLabel = undefined,
    className = undefined,
    clearable = true,
    defaultSelection = undefined,
    disabled = false,
    id = null,
    idInput: idInputProp = null,
    itemDescription = 'description',
    itemIcon = 'icon',
    itemLabel = 'label',
    itemValue = 'value',
    items: itemsProp,
    loading: loadingProp = false,
    menuPlacement = 'auto',
    menuPosition = 'fixed',
    minCharactersToAutocomplete = 0,
    multiple = false,
    onBeforeChange = null,
    onChange: onChangeProp,
    placeholder = undefined,
    readOnly = false, // unlike disabled, the dropdown is not greyed out but its menu cannot be opened
    renderOptionLabel = null,
    renderSelectedLabel = null,
    searchable = true,
    selection = undefined,
    testId = null,
    title = null,
    validation,
    validationTooltipPosition = 'top',
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
    readOnly,
    selection,
    title,
  })

  // stable components: new ones at every render would remount the options and the selected value
  const selectComponents = useMemo(
    () => ({
      Option: OptionComponent({ renderOptionLabel }),
      SingleValue: SingleValueComponent({ renderSelectedLabel }),
    }),
    [renderOptionLabel, renderSelectedLabel]
  )

  return (
    <ValidationTooltip
      className={classNames('dropdown-wrapper dropdown-validation-tooltip', className)}
      id={id}
      testId={testId}
      validation={validation}
      position={validationTooltipPosition}
    >
      <ReactSelect
        aria-label={ariaLabel}
        className="dropdown"
        classNamePrefix="dropdown"
        components={selectComponents}
        defaultValue={defaultValue}
        filterOption={createFilter({ stringify: (option) => option.label })}
        inputId={inputId}
        isClearable={clearable && !readOnly}
        isDisabled={disabled}
        isLoading={loading || loadingProp}
        isMulti={multiple}
        isSearchable={searchable && !readOnly}
        onChange={onChange}
        openMenuOnClick={openMenuOnClick}
        menuPlacement={menuPlacement}
        menuPosition={menuPosition}
        menuIsOpen={menuIsOpen}
        onInputChange={onInputChange}
        options={options}
        placeholder={placeholder}
        ref={selectRef}
        theme={dropdownTheme}
        value={value}
      />
    </ValidationTooltip>
  )
}

export default Dropdown
