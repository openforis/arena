import './Select.scss'
import React, { Fragment } from 'react'
import ReactSelect, { components } from 'react-select'
import * as A from '@core/arena'

const DropdownIndicator = (props) => (
  <components.DropdownIndicator {...props}>
    <span className="icon icon-play3 icon-12px dropdown-indicator" />
  </components.DropdownIndicator>
)

const IndicatorSeparator = () => null

const defaultComponents = { DropdownIndicator, IndicatorSeparator }

export const Select = ({
  customStyle = {},
  className = '',
  components: overrideComponents,
  options,
  value,
  onChange,
  ...props
}) => {
  const styles = {
    control: (provided, { isFocused }) => ({
      ...provided,
      background: isFocused ? 'var(--blueLightFocus)' : 'none',
      border: 'none',
      borderBottom: '1px solid var(--greyBorder)',
      padding: '0',
      boxShadow: 'inset 0 0 0 1px transparent',
      minHeight: 'unset',
      width: '100%',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: 0,
    }),
    menu: (provided) => ({
      ...provided,
      margin: 0,
      boxShadow: 'none',
      background: 'var(--blueLightFocus)',
    }),
    menuList: (provided) => ({
      ...provided,
      maxHeight: '200px',
      padding: 0,
    }),
    container: (provided) => ({
      ...provided,
      display: 'flex',
      flex: 1,
    }),
    option: (provided, state) => {
      const { isSelected, isFocused } = state
      //isSelected ? 'var(--blueLightActive)' : 'none',
      return {
        ...provided,
        background: isFocused ? 'var(--blueLight)' : 'none',
        color: 'var(--black)',
        textAlign: 'center',
        cursor: 'pointer',
        outline: 'none',
        gridColumn: 2,
        padding: '0.4rem 0',
        fontSize: '0.9rem',
      }
    },
    singleValue: (provided) => ({
      ...provided,
      margin: 0,
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '.0rem 1rem',
      margin: 0,
      fontSize: '0.9rem',
    }),
    ...customStyle,
  }

  const selectProps = {
    className,
    components: { ...defaultComponents, ...overrideComponents },
    styles: { ...styles },
    ...props,
  }

  /*const optionsPrepared = (options || []).map((option) => ({
    ...option,
    value: option.value,
    label: option.label || option.value,
  }))*/
  const _selection = A.isEmpty(value) ? value : { ...value, value: value.value, label: value.label || value.value }

  console.log('options', options)
  const groupedOptions = options
  /*[
    {
      label: 'Colours',
      options: optionsPrepared,
    },
    {
      label: 'Flavours',
      options: optionsPrepared,
    },
  ]*/

  return (
    <>
      <ReactSelect
        className="basic-single"
        classNamePrefix="select"
        //defaultValue={options[0]}
        name="color"
        options={groupedOptions}
        onChange={onChange}
        value={_selection}
        isSearchable
        theme={(theme) => ({
          ...theme,
          borderRadius: 0,
          colors: {
            ...theme.colors,
            primary: 'var(--greyBorder)',
          },
        })}
        {...selectProps}
      />
    </>
  )
}

export default Select

/*
export const groupedOptions = [
  {
    label: 'Colours',
    options: colourOptions,
  },
  {
    label: 'Flavours',
    options: flavourOptions,
  },
];

 */
