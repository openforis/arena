import React from 'react'
import { connect } from 'react-redux'

import * as R from 'ramda'

import { getSurvey } from '../surveyState'
import { getSurveyLanguages, } from '../../../common/survey/survey'
import { getLanguageLabel } from '../../../common/app/languages'

import { Input } from '../../commonComponents/form/input'

const LabelBadge = ({lang}) => (
  <h6 className="badge-of"
      style={{
        position: 'absolute',
        right: '0',
        textTransform: 'uppercase',
      }}>
    {
      getLanguageLabel(lang)
    }
  </h6>
)

const LabelRow = ({label = '', lang, onChange}) => (
  <div style={{position: 'relative'}}>

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
      <div className="form-item" ref="elem">
        <label className="form-label">{formLabel}</label>

        <div style={{
          display: 'grid',
          gridRowGap: '1rem',
        }}>
          {
            displayLangs.map(lang =>
              <LabelRow key={lang}
                        lang={lang}
                        label={R.prop(lang)(labels)}
                        onChange={onChange}/>
            )
          }
          {
            _canTogglePreview
              ? <button className="btn-s btn-of-light-s"
                        style={{justifySelf: 'end'}}
                        onClick={() => this.togglePreview()}>
                {
                  this.isPreview() ? '...more' : '...less'
                }

              </button>
              : null
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
  languages: getSurveyLanguages(getSurvey(state))
})

export default connect(mapStateToProps,)(LabelsEditor)