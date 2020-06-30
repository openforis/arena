import React from 'react'

import { getLanguageLabel, languages } from '@core/app/languages'

import { useI18n } from '@webapp/store/system'
import Dropdown from './Dropdown'

const LanguageDropdown = props => {
  const { selection, onChange, validation } = props

  const i18n = useI18n()

  const selectedItem = selection ? { key: selection, value: getLanguageLabel(selection) } : null

  return (
    <Dropdown
      placeholder={i18n.t('common.language')}
      items={languages}
      selection={selectedItem}
      onChange={e => onChange(e ? e.key : null)}
      validation={validation}
    />
  )
}

export default LanguageDropdown
