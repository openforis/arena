import './labelsEditor.scss'

import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import Survey from '../../../common/survey/survey'
import { getStateSurveyInfo } from '../surveyState'
import { getLanguageLabel } from '../../../common/app/languages'

import { Input } from '../../commonComponents/form/input'

const LabelBadge = ({lang}) => (
  <div className="badge-of labels-editor__label-lang-badge">
    {
      getLanguageLabel(lang)
    }
  </div>
)

const LabelRow = ({label = '', lang, onChange}) => (
  <div className="labels-editor__label">

    <LabelBadge lang={lang}/>

    <Input value={label}
           onChange={e => onChange({
               lang,
               label: e.target.value
             }
           )}/>
  </div>
)

class LabelsEditor extends React.Component {

  isPreview () {
    const {preview} = this.state || {preview: true}
    return preview
  }

  togglePreview () {
    this.setState({preview: !this.isPreview()})
  }

  render () {
    const {
      labels,
      formLabel = 'Label(s)',
      languages,
      onChange,
      maxPreview = 2,
      canTogglePreview = true,
    } = this.props

    const displayLangs = this.isPreview()
      ? R.slice(0, maxPreview, languages)
      : languages

    const _canTogglePreview = canTogglePreview && languages.length > maxPreview

    return (
      <div className="form-item labels-editor" ref="elem">
        <label className="form-label">
          {formLabel}
          {
            _canTogglePreview
              ? <button className="btn-s btn-of-light-s btn-toggle-labels"
                        style={{justifySelf: 'end'}}
                        onClick={() => this.togglePreview()}>
                <span className={`icon icon-${this.isPreview() ? 'enlarge2' : 'shrink2'} icon-12px`}/>
                {/*{*/}
                {/*this.isPreview() ? '...more' : '...less'*/}
                {/*}*/}

              </button>
              : null
          }
        </label>

        <div className="labels-editor__labels">
          {
            displayLangs.map(lang =>
              <LabelRow key={lang}
                        lang={lang}
                        label={R.prop(lang)(labels)}
                        onChange={onChange}/>
            )
          }
        </div>
      </div>

    )
  }

}

LabelsEditor.defaultProps = {
  languages: [],
}

const mapStateToProps = state => ({
  languages: Survey.getLanguages(getStateSurveyInfo(state))
})

export default connect(mapStateToProps,)(LabelsEditor)