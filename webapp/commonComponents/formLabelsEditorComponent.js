import React from 'react'
import * as R from 'ramda'

import { getLanguageLabel } from '../../common/app/languages'

import { FormInput } from './formInputComponents'

import { elementOffset } from '../appUtils/domUtils'

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

    <FormInput value={label}
               onChange={e => onChange({
                   lang,
                   label: e.target.value
                 }
               )}/>
  </div>
)

class FormLabelsEditorComponent extends React.Component {

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
    } = this.props

    const displayLangs = this.isPreview()
      ? R.slice(0, maxPreview, languages)
      : languages

    const canTogglePreview = languages.length > maxPreview

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
            canTogglePreview
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

export default FormLabelsEditorComponent