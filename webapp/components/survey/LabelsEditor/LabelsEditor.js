import './LabelsEditor.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import * as A from '@core/arena'

import ValidationTooltip from '@webapp/components/validationTooltip'
import { useSurveyLangs, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import ButtonToggle from './ButtonToggle'
import Label from './Label'

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
    labels,
    showFormLabel,
    formLabelKey,
    languages: languagesFromProps,
    onChange,
    placeholder,
    readOnly,
    compactLanguage,
    validation,
    inputFieldIdPrefix,
    inputType,
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
}

LabelsEditor.defaultProps = {
  compactLanguage: false,
  formLabelKey: 'common.label',
  inputFieldIdPrefix: null,
  inputType: 'input',
  languages: [],
  labels: {},
  onChange: null,
  placeholder: null,
  readOnly: false,
  showFormLabel: true,
  validation: null,
}

export default LabelsEditor
