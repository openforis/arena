/* eslint-disable react/jsx-props-no-spreading */
import React from 'react'
import { components } from 'react-select'

const DropdownIndicator = (props) => (
  <components.DropdownIndicator {...props}>
    <span className="icon icon-play3 icon-12px dropdown-indicator" />
  </components.DropdownIndicator>
)

const IndicatorSeparator = () => null

export const defaultComponents = { DropdownIndicator, IndicatorSeparator }

export const baseStyles = {
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
    const { isFocused } = state
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
}

export const baseTheme = (theme) => ({
  ...theme,
  borderRadius: 0,
  colors: {
    ...theme.colors,
    primary: 'var(--greyBorder)',
  },
})
