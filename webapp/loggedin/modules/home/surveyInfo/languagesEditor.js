import React from 'react'

import useI18n from '../../../../commonComponents/useI18n'

import InputChips from '../../../../commonComponents/form/inputChips'

import Survey from '../../../../../common/survey/survey'
import { getLanguageLabel, languages } from '../../../../../common/app/languages'

const LanguagesEditor = props => {

  const { surveyInfo, readOnly, updateSurveyInfoProp } = props

  const surveyLanguages = Survey.getLanguages(surveyInfo)

  const selection = surveyLanguages.map(lang => ({ key: lang, value: getLanguageLabel(lang) }))

  const i18n = useI18n()

  return (
    <div className="form-item">

      <label className="form-label">{i18n.t('languagesEditor.languages')}</label>

      <InputChips
        items={languages}
        itemKeyProp="key"
        selection={selection}
        onChange={
          items => {
            const newLanguages = items.map(i => i.key)
            updateSurveyInfoProp('languages', newLanguages)
          }
        }
        requiredItems={1}
        readOnly={readOnly}
      />

    </div>
  )

}

export default LanguagesEditor



