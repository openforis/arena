import './labelsEditor.scss'

import React from 'react'
import { connect } from 'react-redux'
import * as R from 'ramda'

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
               label: value
             }
           )}
           readOnly={readOnly}/>
  </div>
)

class LabelsEditor extends React.Component {

  isPreview () {
    const { preview } = this.state || { preview: true }
    return preview
  }

  togglePreview () {
    this.setState({ preview: !this.isPreview() })
  }

  render () {
    const {
      labels,
      showFormLabel,
      formLabel,
      languages,
      onChange,
      maxPreview,
      canTogglePreview,
      readOnly,
      compactLanguage
    } = this.props

    const displayLangs = this.isPreview()
      ? R.slice(0, maxPreview, languages)
      : languages

    const _canTogglePreview = canTogglePreview && languages.length > maxPreview

    const className = `labels-editor ${showFormLabel ? 'with-label' : ''}`

    return (
      <div className={className} ref="elem">
        <div className="labels-editor-label">
          {
            showFormLabel &&
            <label className="form-label">
              {formLabel}
            </label>
          }
          {
            _canTogglePreview &&
            <button className="btn-s btn-of-light-s btn-toggle-labels"
                    style={{ justifySelf: 'end' }}
                    onClick={() => this.togglePreview()}>
              <span className={`icon icon-${this.isPreview() ? 'enlarge2' : 'shrink2'} icon-12px`}/>
              {/*{*/}
              {/*this.isPreview() ? '...more' : '...less'*/}
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

}

LabelsEditor.defaultProps = {
  languages: [],
  labels: [],
  showFormLabel: true,
  formLabel: 'Label(s)',
  maxPreview: 2,
  canTogglePreview: true,
  readOnly: false,
  compactLanguage: false,
  onChange: null,
}

const mapStateToProps = state => ({
  languages: Survey.getLanguages(SurveyState.getStateSurveyInfo(state))
})

export default connect(mapStateToProps,)(LabelsEditor)