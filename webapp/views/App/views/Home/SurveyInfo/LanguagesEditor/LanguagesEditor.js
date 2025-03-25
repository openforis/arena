import React from 'react'
import PropTypes from 'prop-types'

import * as R from 'ramda'

import { useI18n } from '@webapp/store/system'
import InputChips from '@webapp/components/form/InputChips'

import { getLanguageLabel, languageItemsSortedByEnLabel as appLanguages } from '@core/app/languages'

const LanguagesEditor = (props) => {
  const { idInput, languages, setLanguages, readOnly } = props

  const selection = languages.map((lang) => ({
    value: lang,
    label: getLanguageLabel(lang),
  }))

  const i18n = useI18n()

  return (
    <div className="form-item">
      <label className="form-label" htmlFor={idInput}>
        {i18n.t('languagesEditor.languages')}
      </label>

      <InputChips
        className="lanuages_editor__input_chips"
        idInput={idInput}
        items={appLanguages}
        selection={selection}
        onChange={(items) => {
          setLanguages(R.pluck('value', items))
        }}
        requiredItems={1}
        readOnly={readOnly}
      />
    </div>
  )
}

LanguagesEditor.propTypes = {
  idInput: PropTypes.string,
  languages: PropTypes.array.isRequired,
  setLanguages: PropTypes.func.isRequired,
  readOnly: PropTypes.bool.isRequired,
}

export default LanguagesEditor
