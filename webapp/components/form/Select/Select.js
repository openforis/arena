/* eslint-disable react/jsx-props-no-spreading */
import './Select.scss'
import React from 'react'
import PropTypes from 'prop-types'
import ReactSelect from 'react-select'

import { defaultComponents, baseStyles, baseTheme } from './config'
import { adaptSelection } from './utils'

export const Select = ({ style, className, components, options, value, onChange }) => (
  <ReactSelect
    className={className}
    classNamePrefix="select"
    options={options}
    onChange={onChange}
    value={adaptSelection(value)}
    isSearchable
    theme={baseTheme}
    components={{ ...defaultComponents, ...components }}
    styles={{ ...baseStyles, ...style }}
  />
)

Select.propTypes = {
  style: PropTypes.object,
  className: PropTypes.string,
  components: PropTypes.object,
  options: PropTypes.array,
  value: PropTypes.object,
  onChange: PropTypes.func,
}

Select.defaultProps = {
  style: {},
  className: '',
  components: {},
  options: [],
  value: {},
  onChange: null,
}

export default Select
