import './surveyCreateView.scss'

import React, {useEffect} from 'react'
import {connect} from 'react-redux'

import * as Survey from '@core/survey/survey'

import {Input} from '@webapp/commonComponents/form/input'
import LanguageDropdown from '@webapp/commonComponents/form/languageDropdown'
import UploadButton from '@webapp/commonComponents/form/uploadButton'
import {useI18n, useOnUpdate} from '@webapp/commonComponents/hooks'

import * as Validation from '@core/validation/validation'
import * as StringUtils from '@core/stringUtils'

import * as SurveyState from '@webapp/survey/surveyState'
import {appModuleUri, homeModules} from '../../../appModules'
import * as SurveyCreateState from './surveyCreateState'

import {updateNewSurveyProp, resetNewSurvey, createSurvey, importCollectSurvey} from './actions'

const SurveyCreateView = props => {
  const {
    surveyInfo, newSurvey, history,
    resetNewSurvey, updateNewSurveyProp, createSurvey, importCollectSurvey
  } = props

  const {name, label, lang, validation} = newSurvey

  const i18n = useI18n()

  // OnMount reset new survey
  useEffect(() => {
    resetNewSurvey()
  }, [])

  // Redirect to dashboard on survey change
  useOnUpdate(() => {
    history.push(appModuleUri(homeModules.dashboard))
  }, [Survey.getUuid(surveyInfo)])

  return (
    <div className="home-survey-create">
      <div>
        <Input
          placeholder={i18n.t('common.name')}
          value={name}
          validation={Validation.getFieldValidation('name')(validation)}
          onChange={value => updateNewSurveyProp('name', StringUtils.normalizeName(value))}/>
      </div>
      <div>
        <Input
          placeholder={i18n.t('common.label')}
          value={label}
          validation={Validation.getFieldValidation('label')(validation)}
          onChange={value => updateNewSurveyProp('label', value)}/>
      </div>
      <div>
        <LanguageDropdown
          selection={lang}
          onChange={e => updateNewSurveyProp('lang', e)}
          validation={Validation.getFieldValidation('lang')(validation)}/>
      </div>
      <button className="btn"
        onClick={() => createSurvey({name, label, lang})}>
        <span className="icon icon-plus icon-left icon-12px"/>
        {i18n.t('homeView.surveyCreate.createSurvey')}
      </button>

      <div className="home-survey-create__collect-import">

        <UploadButton
          label={i18n.t('homeView.surveyCreate.importFromCollect')}
          accept={'.collect-backup'}
          maxSize={1000}
          onChange={files => importCollectSurvey(files[0])}/>
      </div>

    </div>
  )
}

const mapStateToProps = state => ({
  surveyInfo: SurveyState.getSurveyInfo(state),
  newSurvey: SurveyCreateState.getNewSurvey(state),
})

export default connect(
  mapStateToProps,
  {
    resetNewSurvey,
    createSurvey,
    updateNewSurveyProp,
    importCollectSurvey,
  }
)(SurveyCreateView)
