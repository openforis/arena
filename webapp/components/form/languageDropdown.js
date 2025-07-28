import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import {
  getLanguageISO639part2Label,
  getLanguageLabel,
  languageItemsISO639part2SortedByEnLabel,
  languageItemsSortedByEnLabel,
  standards,
} from '@core/app/languages'

import { useI18n } from '@webapp/store/system'

import Dropdown from './Dropdown'

const LanguageDropdown = (props) => {
  const {
    disabled = false,
    onChange = () => ({}),
    selection = null,
    standard = standards.ISO_639_1,
    validation = {},
  } = props

  const i18n = useI18n()

  const items =
    standard === standards.ISO_639_1 ? languageItemsSortedByEnLabel : languageItemsISO639part2SortedByEnLabel

  const selectedItem = selection
    ? {
        value: selection,
        label: standard === standards.ISO_639_1 ? getLanguageLabel(selection) : getLanguageISO639part2Label(selection),
      }
    : null

  const onChangeFn = useCallback((item) => onChange(item ? item.value : null), [onChange])

  return (
    <Dropdown
      disabled={disabled}
      items={items}
      onChange={onChangeFn}
      placeholder={i18n.t('common.language')}
      selection={selectedItem}
      validation={validation}
    />
  )
}

LanguageDropdown.propTypes = {
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  selection: PropTypes.string,
  standard: PropTypes.oneOf([standards.ISO_639_1, standards.ISO_639_2]),
  validation: PropTypes.object,
}

export default LanguageDropdown
