import React from 'react'

import Dropdown from './dropdown'

import { getLanguageLabel, languages } from '../../../common/app/languages'

import useI18n from '../../commonComponents/useI18n'

const LanguageDropdown = (props) => {

  const { selection, onChange, validation } = props

  const i18n = useI18n()

  const selectedItem = selection
    ? { key: selection, value: getLanguageLabel(selection) }
    : null

  return <Dropdown placeholder={i18n.t('common.language')}
                   items={languages}
                   selection={selectedItem}
                   onChange={e => onChange(e ? e.key : null)}
                   validation={validation}/>

}

export default LanguageDropdown
