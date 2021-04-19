import './Select.scss'
import React from 'react'
import PropTypes from 'prop-types'
import ReactSelect from 'react-select'

import { defaultComponents, baseStyles, baseTheme } from './config'
import { adaptSelection } from './utils'

export const Select = ({ className, components, id, onChange, options, placeholder, style, value }) => (
  <ReactSelect
    className={className}
    classNamePrefix="select"
    options={options}
    onChange={onChange}
    value={adaptSelection(value)}
    id={id}
    isSearchable
    theme={baseTheme}
    components={{ ...defaultComponents, ...components }}
    styles={{ ...baseStyles, ...style }}
    placeholder={placeholder}
  />
)

Select.propTypes = {
  className: PropTypes.string,
  components: PropTypes.object,
  id: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.array,
  placeholder: PropTypes.string,
  style: PropTypes.object,
  value: PropTypes.object,
}

Select.defaultProps = {
  className: '',
  components: {},
  id: undefined,
  onChange: null,
  options: [],
  placeholder: undefined,
  style: {},
  value: {},
}

export default Select
