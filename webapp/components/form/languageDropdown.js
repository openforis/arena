import React from 'react'
import PropTypes from 'prop-types'

import { getLanguageLabel, languageItemsSortedByEnLabel } from '@core/app/languages'

import { useI18n } from '@webapp/store/system'
import Dropdown from './Dropdown'

const LanguageDropdown = (props) => {
  const { disabled = false, onChange = () => ({}), selection = null, validation = {} } = props

  const i18n = useI18n()

  const selectedItem = selection ? { value: selection, label: getLanguageLabel(selection) } : null

  return (
    <Dropdown
      placeholder={i18n.t('common.language')}
      items={languageItemsSortedByEnLabel}
      selection={selectedItem}
      onChange={(item) => onChange(item ? item.value : null)}
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

export default LanguageDropdown
