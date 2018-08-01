import React from 'react'
import * as R from 'ramda'

import { getLanguageLabel } from '../../common/app/languages'

import { FormInput } from './formInputComponents'

const LabelRow = ({label = '', lang, onChange, displayLang = true}) => {
  return (
    <React.Fragment>
      {
        displayLang
          ? <h6 style={{alignSelf: 'end'}}>{
            R.pipe(
              getLanguageLabel,
              R.toUpper
            )(lang)
          }</h6>
          : null
      }
      <FormInput value={label}
                 onChange={e => onChange({
                     lang,
                     label: e.target.value
                   }
                 )}/>
    </React.Fragment>
  )
}

const FormLabelsEditorComponent = ({languages, labels, onChange}) => {
  const displayLang = languages.length > 1

  return (
    <div className="form-item">
      <label className="form-label">Label(s)</label>

      <div style={{
        display: 'grid',
        gridTemplateColumns: displayLang ? '.1fr .9fr' : '1fr',
        gridRowGap: '.5rem',
        alignItems: 'center',
      }}>
        {
          languages.map(lang =>
            <LabelRow key={lang}
                      lang={lang}
                      label={R.prop(lang)(labels)}
                      onChange={onChange}
                      displayLang={displayLang}/>
          )
        }
      </div>
    </div>
  )
}

export default FormLabelsEditorComponent