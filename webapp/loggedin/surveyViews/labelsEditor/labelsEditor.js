import './labelsEditor.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

import { useI18n } from '../../../commonComponents/hooks'

import { Input } from '../../../commonComponents/form/input'

import Survey from '../../../../common/survey/survey'
import * as SurveyState from '../../../survey/surveyState'

import { getLanguageLabel } from '../../../../common/app/languages'

const LanguageBadge = ({ lang, compact }) => (
  <div className="badge-of labels-editor__label-lang-badge" title={compact ? getLanguageLabel(lang) : null}>
    {
      compact ? lang : getLanguageLabel(lang)
    }
  </div>
)

const LabelRow = ({ label = '', lang, onChange, readOnly, showLanguageBadge = true, compactLanguage }) => (
  <div className="labels-editor__label">

    {
      showLanguageBadge &&
      <LanguageBadge lang={lang} compact={compactLanguage}/>
    }

    <Input value={label}
           onChange={value => onChange({
             lang,
             label: value,
           })}
           readOnly={readOnly}/>
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
  } = props

  const displayLangs = preview
    ? R.slice(0, maxPreview, languages)
    : languages

  const _canTogglePreview = canTogglePreview && languages.length > maxPreview

  const className = `labels-editor ${showFormLabel ? 'with-label' : ''}`

  return (
    <div className={className}>
      <div className="labels-editor-label">
        {
          showFormLabel &&
          <label className="form-label">
            {i18n.t(formLabelKey, { count: languages.length })}
          </label>
        }
        {
          _canTogglePreview &&
          <button className="btn-s btn-toggle-labels"
                  style={{ justifySelf: 'end' }}
                  onClick={() => setPreview(!preview)}>
            <span className={`icon icon-${preview ? 'enlarge2' : 'shrink2'} icon-12px`}/>
            {/*{*/}
            {/*this.preview() ? '...more' : '...less'*/}
            {/*}*/}
          </button>
        }
      </div>
      <div className="labels-editor__labels">
        {
          displayLangs.map(lang =>
            <LabelRow key={lang}
                      lang={lang}
                      label={R.prop(lang)(labels)}
                      onChange={onChange}
                      readOnly={readOnly}
                      showLanguageBadge={languages.length > 1}
                      compactLanguage={compactLanguage}/>
          )
        }
      </div>

    </div>
  )
}

LabelsEditor.defaultProps = {
  languages: [],
  labels: [],
  showFormLabel: true,
  formLabelKey: 'common.label',
  maxPreview: 2,
  canTogglePreview: true,
  readOnly: false,
  compactLanguage: false,
  onChange: null,
}

const mapStateToProps = (state, props) => ({
  languages: props.languages || Survey.getLanguages(SurveyState.getSurveyInfo(state))
})

export default connect(mapStateToProps)(LabelsEditor)