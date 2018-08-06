import React from 'react'
import * as R from 'ramda'

import Dropdown from './dropdown'

import { getLanguageLabel, languages } from '../../common/app/languages'

const LanguageDropdownComponent = (props) => {

  const {selection, onChange, validation} = props

  const selectedItem = selection
    ? {key: selection, value: getLanguageLabel(selection)}
    : null

  return <Dropdown placeholder="Language"
                   items={languages}
                   selection={selectedItem}
                   onChange={e => onChange(e ? e.key : null)}
                   validation={validation}/>

}

export default LanguageDropdownComponent
