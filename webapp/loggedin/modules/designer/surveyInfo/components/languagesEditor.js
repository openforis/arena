import React from 'react'
import * as R from 'ramda'

import { useI18n } from '@webapp/components/hooks'
import InputChips from '@webapp/components/form/inputChips'

import { getLanguageLabel, languages as appLanguages } from '@core/app/languages'

const LanguagesEditor = props => {
  const { languages, setLanguages, readOnly } = props

  const selection = languages.map(lang => ({
    key: lang,
    value: getLanguageLabel(lang),
  }))

  const i18n = useI18n()

  return (
    <div className="form-item">
      <label className="form-label">{i18n.t('languagesEditor.languages')}</label>

      <InputChips
        items={appLanguages}
        itemKeyProp="key"
        selection={selection}
        onChange={items => {
          setLanguages(R.pluck('key', items))
        }}
        requiredItems={1}
        readOnly={readOnly}
      />
    </div>
  )
}

export default LanguagesEditor
