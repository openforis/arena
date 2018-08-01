import React from 'react'
import * as R from 'ramda'

import DropdownComponent from './dropdownComponent'

import { getLanguageLabel, languages } from '../../common/app/languages'

const LanguageDropdownComponent = (props) => {

  const {selection, onChange, validation} = props

  const dropdownItems = R.pipe(
    R.keys,
    R.map(lang => ({key: lang, value: getLanguageLabel(lang)}))
  )(languages)

  const selectedItem = selection
    ? {key: selection, value: getLanguageLabel(selection)}
    : null

  return <DropdownComponent placeholder="Language"
                            items={dropdownItems}
                            selection={selectedItem}
                            onChange={e => onChange(e ? e.key : null)}
                            validation={validation}/>

}

export default LanguageDropdownComponent
