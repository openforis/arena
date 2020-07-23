import React from 'react'
import PropTypes from 'prop-types'

import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'
import InputChips from '@webapp/components/form/InputChips'

import { getLanguageLabel, languages as appLanguages } from '@core/app/languages'

const LanguagesEditor = (props) => {
  const { languages, setLanguages, readOnly } = props

  const selection = languages.map((lang) => ({
    key: lang,
    value: getLanguageLabel(lang),
  }))

  const i18n = useI18n()

  return (
    <div className="form-item">
      <label className="form-label">{i18n.t('languagesEditor.languages')}</label>

      <InputChips
        items={appLanguages}
        selection={selection}
        onChange={(items) => {
          setLanguages(R.pluck('key', items))
        }}
        requiredItems={1}
        readOnly={readOnly}
        itemKey="key"
      />
    </div>
  )
}

LanguagesEditor.propTypes = {
  languages: PropTypes.array.isRequired,
  setLanguages: PropTypes.func.isRequired,
  readOnly: PropTypes.bool.isRequired,
}

export default LanguagesEditor
