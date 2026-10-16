import './dropdown.scss'

import PropTypes from 'prop-types'
import ReactSelect, { components, createFilter } from 'react-select'
import classNames from 'classnames'

import { TestId } from '@webapp/utils/testId'
import ValidationTooltip from '@webapp/components/validationTooltip'
import { themeColors } from '@webapp/theme/tokens'
import { LabelWithTooltip } from '../LabelWithTooltip'
import { useDropdown } from './useDropdown'

// react-select colors mapped to the theme tokens (CSS variables), so the dropdowns follow the active theme
const dropdownThemeColors = {
  primary: themeColors.primary,
  primary75: themeColors.primaryContainerHigh,
  primary50: themeColors.primaryContainer,
  primary25: themeColors.primaryContainerLow,
  danger: themeColors.error,
  dangerLight: themeColors.errorContainer,
  neutral0: themeColors.surface,
  neutral5: themeColors.background,
  neutral10: themeColors.surfaceVariant,
  neutral20: themeColors.outline,
  neutral30: `color-mix(in srgb, ${themeColors.outline}, ${themeColors.onSurface} 30%)`,
  neutral40: themeColors.onSurfaceVariant,
  neutral50: themeColors.onSurfaceVariant,
  neutral60: themeColors.onSurfaceVariant,
  neutral70: themeColors.onSurface,
  neutral80: themeColors.onSurface,
  neutral90: themeColors.onSurface,
}

const dropdownTheme = (theme) => ({ ...theme, colors: { ...theme.colors, ...dropdownThemeColors } })

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

const SingleValueComponent = (reactSelectProps) => {
  const { children: childrenProp, ...otherProps } = reactSelectProps
  const children = childrenProp && typeof childrenProp === 'string' ? childrenProp.trim() : childrenProp
  return (
    <components.SingleValue {...otherProps}>
      <LabelWithTooltip label={children} />
    </components.SingleValue>
  )
}

const Dropdown = (props) => {
  const {
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
    searchable = true,
    selection = undefined,
    testId = null,
    title = null,
    validation = {},
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

  return (
    <ValidationTooltip
      className={classNames('dropdown-wrapper dropdown-validation-tooltip', className)}
      id={id}
      testId={testId}
      validation={validation}
      position={validationTooltipPosition}
    >
      <ReactSelect
        className="dropdown"
        classNamePrefix="dropdown"
        components={{ Option: OptionComponent({ renderOptionLabel }), SingleValue: SingleValueComponent }}
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

Dropdown.propTypes = {
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
  loading: PropTypes.bool,
  menuPlacement: PropTypes.oneOf(['auto', 'top', 'bottom']),
  menuPosition: PropTypes.oneOf(['absolute', 'fixed']),
  minCharactersToAutocomplete: PropTypes.number,
  multiple: PropTypes.bool,
  onBeforeChange: PropTypes.func, // Executed before onChange: if false is returned, onChange is not executed (item cannot be selected)
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  renderOptionLabel: PropTypes.func,
  searchable: PropTypes.bool,
  selection: PropTypes.oneOfType([PropTypes.object, PropTypes.number, PropTypes.string, PropTypes.array]),
  testId: PropTypes.string,
  title: PropTypes.string,
  validation: PropTypes.object,
  validationTooltipPosition: PropTypes.oneOf(['bottom', 'top']),
}

export default Dropdown
