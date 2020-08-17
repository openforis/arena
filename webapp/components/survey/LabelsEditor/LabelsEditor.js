import './LabelsEditor.scss'

import React, { useState } from 'react'
import PropTypes from 'prop-types'
import * as R from 'ramda'

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
  } = props

  const i18n = useI18n()
  const [editingLabels, setEditingLabels] = useState(false)
  const surveyLangs = useSurveyLangs()
  const languages = !R.isEmpty(languagesFromProps) ? languagesFromProps : surveyLangs

  const language = R.slice(0, MAX_PREVIEW_LANGUAGES, languages)

  const canTogglePreview = languages.length > MAX_PREVIEW_LANGUAGES

  const className = `labels-editor ${showFormLabel ? 'with-label' : ''}`

  return (
    <div className={className}>
      <div className="labels-editor-label">
        {showFormLabel && <label className="form-label">{i18n.t(formLabelKey, { count: languages.length })}</label>}
        {canTogglePreview && <ButtonToggle onClick={() => setEditingLabels(true)} open={editingLabels} />}
      </div>
      <div className="labels-editor__labels">
        <ValidationTooltip validation={validation}>
          <Label
            key={language}
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
        <PanelRight
          width="100vw"
          onClose={() => setEditingLabels(false)}
          header={i18n.t(formLabelKey, { count: languages.length })}
        >
          <div className="labels-editor__labels">
            <ValidationTooltip validation={validation}>
              {languages.map((lang) => (
                <Label
                  key={lang}
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
