import './SurveyInfo.scss'

import React from 'react'

import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { Input } from '@webapp/components/form/Input'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { ButtonSave } from '@webapp/components'

import CyclesEditor from './CyclesEditor'
import SrsEditor from './SrsEditor'
import LanguagesEditor from './LanguagesEditor'

import { useSurveyInfoForm } from './store'

const SurveyInfo = () => {
  const surveyInfo = useSurveyInfo()
  const readOnly = !useAuthCanEditSurvey()

  const i18n = useI18n()

  const {
    name,
    languages,
    srs,
    labels,
    descriptions,
    cycles,
    setName,
    setLanguages,
    setSrs,
    setLabels,
    setDescriptions,
    setCycles,
    getFieldValidation,
    saveProps,
  } = useSurveyInfoForm()

  return (
    <div className="home-survey-info">
      <div className="form">
        <div className="form-item">
          <label className="form-label" htmlFor="survey-info-name">
            {i18n.t('common.name')}
          </label>
          <Input
            id={TestId.surveyInfo.surveyName}
            value={name}
            validation={getFieldValidation(Survey.infoKeys.name)}
            onChange={setName}
            readOnly={readOnly}
          />
        </div>

        <LabelsEditor
          inputFieldIdPrefix={TestId.surveyInfo.surveyLabel('')}
          readOnly={readOnly}
          languages={languages}
          labels={labels}
          onChange={setLabels}
        />

        <LabelsEditor
          inputFieldIdPrefix={TestId.surveyInfo.surveyDescription('')}
          inputType="textarea"
          readOnly={readOnly}
          formLabelKey="common.description"
          languages={languages}
          labels={descriptions}
          onChange={setDescriptions}
        />

        <LanguagesEditor
          idInput={TestId.surveyInfo.surveyLanguage}
          readOnly={readOnly}
          languages={languages}
          setLanguages={setLanguages}
        />

        <div className="form-item">
          <label className="form-label" htmlFor="survey-info-srs">
            {i18n.t('common.srs')}
          </label>
          <SrsEditor readOnly={readOnly} srs={srs} setSrs={setSrs} validation={getFieldValidation('srs')} />
        </div>

        <div className="form-item">
          <label className="form-label" htmlFor="survey-info-cycles">
            {i18n.t('common.cycle_plural')}
          </label>
          <CyclesEditor
            readOnly={readOnly}
            cycles={cycles}
            setCycles={setCycles}
            surveyInfo={surveyInfo}
            validation={getFieldValidation(Survey.infoKeys.cycles)}
          />
        </div>

        {!readOnly && <ButtonSave className="btn-save" testId={TestId.surveyInfo.saveBtn} onClick={saveProps} />}
      </div>
    </div>
  )
}

export default SurveyInfo
