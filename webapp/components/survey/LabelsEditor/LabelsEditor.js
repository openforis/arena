import './LabelsEditor.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as A from '@core/arena'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { useSurveyLangs, useSurveyPreferredLang } from '@webapp/store/survey'

import ValidationTooltip from '@webapp/components/validationTooltip'

import Label from './Label'
import ButtonToggle from './ButtonToggle'

const MAX_PREVIEW_LANGUAGES = 1

// puts the preferred language on top
const sortLanguages = ({ languages, preferredLanguage }) =>
  [...languages].sort((langA, langB) => {
    if (langA === preferredLanguage) return -1
    if (langB === preferredLanguage) return 1
    return 0
  })

const LabelsEditor = (props) => {
  const {
    compactLanguage = false,
    formLabelKey = 'common.label',
    inputFieldIdPrefix,
    inputType = 'input',
    labels = {},
    languages: languagesFromProps = [],
    onChange,
    placeholder,
    readOnly = false,
    showFormLabel = true,
    textTransformFunction,
    validation,
  } = props

  const i18n = useI18n()
  const [editingLabels, setEditingLabels] = useState(false)
  const surveyLanguages = useSurveyLangs()
  const languages = !A.isEmpty(languagesFromProps) ? languagesFromProps : surveyLanguages
  const preferredLanguage = useSurveyPreferredLang()
  const languagesSorted = sortLanguages({ languages, preferredLanguage })

  const canToggleEditor = languages.length > MAX_PREVIEW_LANGUAGES
  const languagesToEdit = editingLabels ? languagesSorted : [preferredLanguage]
  const showLanguageBadge = languagesToEdit.length > 1

  return (
    <div className={classNames('labels-editor', { 'with-label': showFormLabel })}>
      <div className="labels-editor-label">
        {showFormLabel && <span className="form-label">{i18n.t(formLabelKey, { count: languages.length })}</span>}
        {canToggleEditor && <ButtonToggle onClick={() => setEditingLabels(!editingLabels)} open={editingLabels} />}
      </div>
      <div className="labels-editor__labels">
        <ValidationTooltip validation={validation}>
          {languagesToEdit.map((lang) => (
            <Label
              key={lang}
              inputFieldIdPrefix={inputFieldIdPrefix}
              inputType={inputType}
              lang={lang}
              labels={labels}
              onChange={onChange}
              placeholder={i18n.t(placeholder)}
              readOnly={readOnly}
              showLanguageBadge={showLanguageBadge}
              compactLanguage={compactLanguage}
              textTransformFunction={textTransformFunction}
            />
          ))}
        </ValidationTooltip>
      </div>
    </div>
  )
}

LabelsEditor.propTypes = {
  compactLanguage: PropTypes.bool,
  formLabelKey: PropTypes.string,
  inputFieldIdPrefix: PropTypes.string,
  inputType: PropTypes.oneOf(['input', 'textarea']),
  languages: PropTypes.array,
  labels: PropTypes.object,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  readOnly: PropTypes.bool,
  showFormLabel: PropTypes.bool,
  validation: PropTypes.object,
  textTransformFunction: PropTypes.func,
}

export default LabelsEditor
