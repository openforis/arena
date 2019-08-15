import React from 'react'
import * as R from 'ramda'
import useI18n from '../../../../../commonComponents/useI18n'

import InputChips from '../../../../../commonComponents/form/inputChips'

import { languages as appLanguages } from '../../../../../../common/app/languages'

const LanguagesEditor = props => {

  const { languages, setLanguageCodes, readOnly } = props

  const i18n = useI18n()

  return (
    <div className="form-item">

      <label className="form-label">{i18n.t('languagesEditor.languages')}</label>

      <InputChips
        items={appLanguages}
        itemKeyProp="key"
        selection={languages}
        onChange={items => {
          setLanguageCodes(R.pluck('key', items))
        }}
        requiredItems={1}
        readOnly={readOnly}
      />

    </div>
  )

}

export default LanguagesEditor



