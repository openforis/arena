import './LabelsEditor.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as A from '@core/arena'
import classNames from 'classnames'

import { useI18n } from '@webapp/store/system'
import { useSurveyLangs } from '@webapp/store/survey'

import ValidationTooltip from '@webapp/components/validationTooltip'
import PanelRight from '@webapp/components/PanelRight'

import Label from './Label'
import ButtonToggle from './ButtonToggle'

const MAX_PREVIEW_LANGUAGES = 1

const LabelsEditor = (props) => {
  const {
    labels,
    showFormLabel,
    formLabelKey,
    languages: languagesFromProps,
    onChange,
    readOnly,
    compactLanguage,
    validation,
    inputFieldIdPrefix,
  } = props

  const i18n = useI18n()
  const [editingLabels, setEditingLabels] = useState(false)
  const surveyLanguages = useSurveyLangs()
  const languages = !A.isEmpty(languagesFromProps) ? languagesFromProps : surveyLanguages
  const language = languages[0]

  const canToggleEditor = languages.length > MAX_PREVIEW_LANGUAGES

  return (
    <div className={classNames('labels-editor', { 'with-label': showFormLabel })}>
      <div className="labels-editor-label">
        {showFormLabel && <span className="form-label">{i18n.t(formLabelKey, { count: languages.length })}</span>}
        {canToggleEditor && <ButtonToggle onClick={() => setEditingLabels(true)} open={editingLabels} />}
      </div>
      <div className="labels-editor__labels">
        <ValidationTooltip validation={validation}>
          <Label
            key={language}
            inputFieldIdPrefix={inputFieldIdPrefix}
            lang={language}
            labels={labels}
            onChange={onChange}
            readOnly={readOnly}
            showLanguageBadge={languages.length > 1}
            compactLanguage={compactLanguage}
          />
        </ValidationTooltip>
      </div>
      {editingLabels && (
        <PanelRight onClose={() => setEditingLabels(false)} header={i18n.t(formLabelKey, { count: languages.length })}>
          <div className="labels-editor__labels">
            <ValidationTooltip validation={validation}>
              {languages.map((lang) => (
                <Label
                  key={lang}
                  inputFieldIdPrefix={inputFieldIdPrefix}
                  lang={lang}
                  labels={labels}
                  onChange={onChange}
                  readOnly={readOnly}
                  showLanguageBadge={languages.length > 1}
                  compactLanguage={compactLanguage}
                />
              ))}
            </ValidationTooltip>
          </div>
        </PanelRight>
      )}
    </div>
  )
}

LabelsEditor.propTypes = {
  inputFieldIdPrefix: PropTypes.string,
  languages: PropTypes.array,
  labels: PropTypes.object,
  showFormLabel: PropTypes.bool,
  formLabelKey: PropTypes.string,
  readOnly: PropTypes.bool,
  compactLanguage: PropTypes.bool,
  validation: PropTypes.object,
  onChange: PropTypes.func,
}

LabelsEditor.defaultProps = {
  inputFieldIdPrefix: null,
  languages: [],
  labels: {},
  showFormLabel: true,
  formLabelKey: 'common.label',
  readOnly: false,
  compactLanguage: false,
  validation: null,
  onChange: null,
}

export default LabelsEditor
