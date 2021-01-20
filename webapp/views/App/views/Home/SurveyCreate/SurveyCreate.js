import './SurveyCreate.scss'

import React from 'react'
import { useHistory } from 'react-router'

import * as StringUtils from '@core/stringUtils'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'
import { appModuleUri, homeModules } from '@webapp/app/appModules'

import { useI18n } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'

import { Input } from '@webapp/components/form/Input'
import LanguageDropdown from '@webapp/components/form/languageDropdown'
import UploadButton from '@webapp/components/form/uploadButton'
import { useOnUpdate } from '@webapp/components/hooks'

import { useCreateSurvey } from './store'

const SurveyCreate = () => {
  const surveyInfo = useSurveyInfo()
  const i18n = useI18n()
  const history = useHistory()

  const { newSurvey, onUpdate, onCreate, onImport } = useCreateSurvey()
  const { name, label, lang, validation } = newSurvey

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
          onChange={(value) => onUpdate({ name: 'name', value: StringUtils.normalizeName(value) })}
        />
      </div>
      <div>
        <Input
          placeholder={i18n.t('common.label')}
          value={label}
          validation={Validation.getFieldValidation('label')(validation)}
          onChange={(value) => onUpdate({ name: 'label', value })}
        />
      </div>
      <div>
        <LanguageDropdown
          selection={lang}
          validation={Validation.getFieldValidation('lang')(validation)}
          onChange={(value) => onUpdate({ name: 'lang', value })}
        />
      </div>
      <button type="button" className="btn" onClick={onCreate}>
        <span className="icon icon-plus icon-left icon-12px" />
        {i18n.t('homeView.surveyCreate.createSurvey')}
      </button>

      <div className="home-survey-create__collect-import">
        <UploadButton
          label={i18n.t('homeView.surveyCreate.importFromArena')}
          accept=".zip"
          onChange={(files) => onImport.Arena({ file: files[0] })}
        />

        <UploadButton
          label={i18n.t('homeView.surveyCreate.importFromCollect')}
          accept=".collect,.collect-backup"
          maxSize={1000}
          onChange={(files) => onImport.Collect({ file: files[0] })}
        />
      </div>
    </div>
  )
}

export default SurveyCreate
