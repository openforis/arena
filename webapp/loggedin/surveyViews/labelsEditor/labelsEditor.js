import './labelsEditor.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/components/hooks'
import { Input } from '@webapp/components/form/input'
import ValidationTooltip from '@webapp/components/validationTooltip'

import { getLanguageLabel } from '@core/app/languages'

import * as SurveyState from '@webapp/survey/surveyState'

const LanguageBadge = ({ lang, compact }) => (
  <div className="badge-of labels-editor__label-lang-badge" title={compact ? getLanguageLabel(lang) : null}>
    {compact ? lang : getLanguageLabel(lang)}
  </div>
)

const LabelRow = ({ labels, lang, onChange, readOnly, showLanguageBadge, compactLanguage }) => (
  <div className="labels-editor__label">
    {showLanguageBadge && <LanguageBadge lang={lang} compact={compactLanguage} />}

    <Input
      value={R.propOr('', lang, labels)}
      onChange={value => onChange(R.ifElse(R.always(R.isEmpty(value)), R.dissoc(lang), R.assoc(lang, value))(labels))}
      readOnly={readOnly}
    />
  </div>
)

const LabelsEditor = props => {
  const [preview, setPreview] = useState(true)

  const i18n = useI18n()

  const {
    labels,
    showFormLabel,
    formLabelKey,
    languages,
    onChange,
    maxPreview,
    canTogglePreview,
    readOnly,
    compactLanguage,
    validation,
  } = props

  const displayLangs = preview ? R.slice(0, maxPreview, languages) : languages

  const _canTogglePreview = canTogglePreview && languages.length > maxPreview

  const className = `labels-editor ${showFormLabel ? 'with-label' : ''}`

  return (
    <div className={className}>
      <div className="labels-editor-label">
        {showFormLabel && <label className="form-label">{i18n.t(formLabelKey, { count: languages.length })}</label>}
        {_canTogglePreview && (
          <button
            className="btn-s btn-toggle-labels"
            style={{ justifySelf: 'end' }}
            onClick={() => setPreview(!preview)}
          >
            <span className={`icon icon-${preview ? 'enlarge2' : 'shrink2'} icon-12px`} />
            {/* { */}
            {/* this.preview() ? '...more' : '...less' */}
            {/* } */}
          </button>
        )}
      </div>
      <div className="labels-editor__labels">
        <ValidationTooltip validation={validation}>
          {displayLangs.map(lang => (
            <LabelRow
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
    </div>
  )
}

LabelsEditor.defaultProps = {
  languages: [],
  labels: {},
  showFormLabel: true,
  formLabelKey: 'common.label',
  maxPreview: 2,
  canTogglePreview: true,
  readOnly: false,
  compactLanguage: false,
  validation: null,
  onChange: null,
}

const mapStateToProps = (state, props) => ({
  languages: props.languages || Survey.getLanguages(SurveyState.getSurveyInfo(state)),
})

export default connect(mapStateToProps)(LabelsEditor)
