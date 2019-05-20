import './surveyCreateView.scss'

import React from 'react'
import { connect } from 'react-redux'

import { Input } from '../../../../commonComponents/form/input'
import LanguageDropdown from '../../../../commonComponents/form/languageDropdown'
import UploadButton from '../../../../commonComponents/form/uploadButton'
import useI18n from '../../../../commonComponents/useI18n'

import { getFieldValidation } from '../../../../../common/validation/validator'
import { normalizeName } from '../../../../../common/stringUtils'

import * as SurveyCreateState from './surveyCreateState'

import { updateNewSurveyProp } from './actions'
import { createSurvey, importCollectSurvey } from './actions'

const SurveyCreateView = (props) => {

  const {
    newSurvey,
    updateNewSurveyProp, createSurvey, importCollectSurvey
  } = props

  const { name, label, lang, validation } = newSurvey

  const i18n = useI18n()

  return (
    <div className="home-survey-create">
      <div>
        <Input
          placeholder={i18n.t('common.name')}
          value={name}
          validation={getFieldValidation('name')(validation)}
          onChange={value => updateNewSurveyProp('name', normalizeName(value))}/>
      </div>
      <div>
        <Input
          placeholder={i18n.t('common.label')}
          value={label}
          validation={getFieldValidation('label')(validation)}
          onChange={value => updateNewSurveyProp('label', value)}/>
      </div>
      <div>
        <LanguageDropdown
          placeholder={i18n.t('homeView.surveyCreate.language')}
          selection={lang}
          onChange={e => updateNewSurveyProp('lang', e)}
          validation={getFieldValidation('lang')(validation)}/>
      </div>
      <button className="btn btn-of-light"
              onClick={() => createSurvey({ name, label, lang })}>
        <span className="icon icon-plus icon-left"/>
        {i18n.t('homeView.surveyCreate.createSurvey')}
      </button>

      <UploadButton
        label={i18n.t('homeView.surveyCreate.importFromCollect')}
        accept={'.collect-backup'}
        maxSize={1000}
        onChange={files => importCollectSurvey(files[0])}/>
    </div>
  )
}

const mapStateToProps = state => ({
  newSurvey: SurveyCreateState.getNewSurvey(state),
})

export default connect(
  mapStateToProps,
  {
    createSurvey,
    updateNewSurveyProp,
    importCollectSurvey,
  }
)(SurveyCreateView)