import React from 'react'
import PropTypes from 'prop-types'

import { getLanguageLabel, languages } from '@core/app/languages'

import { useI18n } from '@webapp/store/system'
import Dropdown from './Dropdown'

const LanguageDropdown = (props) => {
  const { selection, onChange, validation, disabled } = props

  const i18n = useI18n()

  const selectedItem = selection ? { key: selection, value: getLanguageLabel(selection) } : null

  return (
    <Dropdown
      placeholder={i18n.t('common.language')}
      items={languages}
      selection={selectedItem}
      onChange={(e) => onChange(e ? e.key : null)}
      validation={validation}
      disabled={disabled}
    />
  )
}

LanguageDropdown.propTypes = {
  selection: PropTypes.string,
  onChange: PropTypes.func,
  validation: PropTypes.object,
  disabled: PropTypes.bool,
}

LanguageDropdown.defaultProps = {
  selection: null,
  onChange: () => ({}),
  validation: {},
  disabled: false,
}

export default LanguageDropdown
