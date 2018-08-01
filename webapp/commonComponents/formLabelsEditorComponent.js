import React from 'react'
import * as R from 'ramda'

import { getLanguageLabel } from '../../common/app/languages'

import { FormInput } from './formInputComponents'

const LabelBadge = ({lang}) => (
  <h6 className="badge"
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

const FormLabelsEditorComponent = ({languages, labels, onChange}) => (
  <div className="form-item">
    <label className="form-label">Label(s)</label>

    <div style={{
      display: 'grid',
      gridRowGap: '1rem',
    }}>
      {
        languages.map(lang =>
          <LabelRow key={lang}
                    lang={lang}
                    label={R.prop(lang)(labels)}
                    onChange={onChange}/>
        )
      }
    </div>
  </div>
)

export default FormLabelsEditorComponent