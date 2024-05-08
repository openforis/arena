import './SurveyInfo.scss'

import React from 'react'

import * as Survey from '@core/survey/survey'

import { useI18n } from '@webapp/store/system'
import { useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { Checkbox } from '@webapp/components/form'
import { FormItem, Input } from '@webapp/components/form/Input'
import LabelsEditor from '@webapp/components/survey/LabelsEditor'
import { ButtonSave } from '@webapp/components'

import CyclesEditor from './CyclesEditor'
import SrsEditor from './SrsEditor'
import LanguagesEditor from './LanguagesEditor'

import { useSurveyInfoForm } from './store'
import SamplingPolygonEditor from './SamplingPolygonEditor'
import CycleSelector from '@webapp/components/survey/CycleSelector'

const SurveyInfo = () => {
  const surveyInfo = useSurveyInfo()
  const readOnly = !useAuthCanEditSurvey()
  const i18n = useI18n()

  const {
    cycleKeys,
    cycles,
    defaultCycleKey,
    descriptions,
    labels,
    languages,
    name,
    sampleBasedImageInterpretationEnabled,
    samplingPolygon,
    srs,
    setName,
    setLanguages,
    setSrs,
    setSamplingPolygon,
    setLabels,
    setDefaultCycleKey,
    setDescriptions,
    setCycles,
    setSampleBasedImageInterpretationEnabled,
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

        <FormItem label={i18n.t('common.srs')}>
          <SrsEditor readOnly={readOnly} srs={srs} setSrs={setSrs} validation={getFieldValidation('srs')} />
        </FormItem>

        <FormItem label={i18n.t('common.cycle_plural')}>
          <CyclesEditor
            readOnly={readOnly}
            cycles={cycles}
            setCycles={setCycles}
            surveyInfo={surveyInfo}
            validation={getFieldValidation(Survey.infoKeys.cycles)}
          />
        </FormItem>

        {cycleKeys.length > 1 && (
          <FormItem label={i18n.t('homeView.surveyInfo.cycleForArenaMobile')}>
            <CycleSelector cycleKeys={cycleKeys} selectedCycle={defaultCycleKey} onChange={setDefaultCycleKey} />
          </FormItem>
        )}

        <FormItem
          label={i18n.t('homeView.surveyInfo.sampleBasedImageInterpretation')}
          className="sample-based-image-interpretation-form-item"
        >
          <div>
            <Checkbox
              checked={sampleBasedImageInterpretationEnabled}
              onChange={setSampleBasedImageInterpretationEnabled}
              validation={getFieldValidation(Survey.infoKeys.sampleBasedImageInterpretationEnabled)}
            />
            {sampleBasedImageInterpretationEnabled && (
              <SamplingPolygonEditor
                samplingPolygon={samplingPolygon}
                setSamplingPolygon={setSamplingPolygon}
                getFieldValidation={getFieldValidation}
                readOnly={readOnly}
              />
            )}
          </div>
        </FormItem>

        {!readOnly && <ButtonSave className="btn-save" testId={TestId.surveyInfo.saveBtn} onClick={saveProps} />}
      </div>
    </div>
  )
}

export default SurveyInfo
