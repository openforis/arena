import './surveyCreateView.scss'

import React from 'react'
import { connect } from 'react-redux'

import { Input } from '../../../commonComponents/form/input'
import LanguageDropdown from '../../../commonComponents/form/languageDropdown'
import UploadButton from '../../../commonComponents/form/uploadButton'

import { getFieldValidation } from '../../../../common/validation/validator'
import { normalizeName } from '../../../../common/stringUtils'

import * as AppHomeState from '../appHomeState'

import { createSurvey, importCollectSurvey, updateNewSurveyProp } from '../actions'

const SurveyCreateView = (props) => {

  const {
    newSurvey,
    updateNewSurveyProp, createSurvey, importCollectSurvey,
  } = props

  const { name, label, lang, validation } = newSurvey

  return (
    <div className="home-survey-create">
      <div>
        <Input
          placeholder="Name"
          value={name}
          validation={getFieldValidation('name')(validation)}
          onChange={value => updateNewSurveyProp('name', normalizeName(value))}/>
      </div>
      <div>
        <Input
          placeholder="Label"
          value={label}
          validation={getFieldValidation('label')(validation)}
          onChange={value => updateNewSurveyProp('label', value)}/>
      </div>
      <div>
        <LanguageDropdown
          placeholder="Language"
          selection={lang}
          onChange={e => updateNewSurveyProp('lang', e)}
          validation={getFieldValidation('lang')(validation)}/>
      </div>
      <button className="btn btn-of-light"
              onClick={() => createSurvey({ name, label, lang })}>
        <span className="icon icon-plus icon-left"/>
        Create Survey
      </button>

      <UploadButton
        label="Import from Collect"
        onChange={files => importCollectSurvey(files[0])}/>
    </div>
  )
}

const mapStateToProps = state => ({
  newSurvey: AppHomeState.getNewSurvey(state),
})

export default connect(
  mapStateToProps,
  {
    createSurvey,
    updateNewSurveyProp,
    importCollectSurvey,
  }
)(SurveyCreateView)