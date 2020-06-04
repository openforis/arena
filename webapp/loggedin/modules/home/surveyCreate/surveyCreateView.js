import './surveyCreateView.scss'

import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import { Input } from '@webapp/components/form/input'
import LanguageDropdown from '@webapp/components/form/languageDropdown'
import UploadButton from '@webapp/components/form/uploadButton'
import { useI18n, useOnUpdate, useSurveyInfo } from '@webapp/components/hooks'

import { appModuleUri, homeModules } from '@webapp/app/appModules'
import * as SurveyCreateState from './surveyCreateState'

import { updateNewSurveyProp, resetNewSurvey, createSurvey, importCollectSurvey } from './actions'

const SurveyCreateView = () => {
  const newSurvey = useSelector(SurveyCreateState.getNewSurvey)
  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()
  const history = useHistory()
  const dispatch = useDispatch()

  const { name, label, lang, validation } = newSurvey

  // OnMount reset new survey
  useEffect(() => {
    dispatch(resetNewSurvey())
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
          onChange={(value) => dispatch(updateNewSurveyProp('name', StringUtils.normalizeName(value)))}
        />
      </div>
      <div>
        <Input
          placeholder={i18n.t('common.label')}
          value={label}
          validation={Validation.getFieldValidation('label')(validation)}
          onChange={(value) => dispatch(updateNewSurveyProp('label', value))}
        />
      </div>
      <div>
        <LanguageDropdown
          selection={lang}
          onChange={(e) => dispatch(updateNewSurveyProp('lang', e))}
          validation={Validation.getFieldValidation('lang')(validation)}
        />
      </div>
      <button type="button" className="btn" onClick={() => dispatch(createSurvey({ name, label, lang }))}>
        <span className="icon icon-plus icon-left icon-12px" />
        {i18n.t('homeView.surveyCreate.createSurvey')}
      </button>

      <div className="home-survey-create__collect-import">
        <UploadButton
          label={i18n.t('homeView.surveyCreate.importFromCollect')}
          accept=".collect,.collect-backup"
          maxSize={1000}
          onChange={(files) => dispatch(importCollectSurvey(files[0]))}
        />
      </div>
    </div>
  )
}

export default SurveyCreateView
