import React from 'react'

import InputChips from '../../../../commonComponents/form/inputChips'

import Survey from '../../../../../common/survey/survey'
import { getLanguageLabel, languages } from '../../../../../common/app/languages'

const LanguagesEditor = props => {

  const { surveyInfo, readOnly, updateSurveyInfoProp } = props

  const surveyLanguages = Survey.getLanguages(surveyInfo)

  const selection = surveyLanguages.map(lang => ({ key: lang, value: getLanguageLabel(lang) }))

  return (
    <div className="form-item">

      <label className="form-label">Language(s)</label>

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



