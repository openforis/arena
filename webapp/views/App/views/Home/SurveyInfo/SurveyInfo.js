import './SurveyInfo.scss'

import React from 'react'

import * as ProcessUtils from '@core/processUtils'

import { useI18n } from '@webapp/store/system'
import { useAuthCanEditSurvey, useUserIsSystemAdmin } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { ButtonSave } from '@webapp/components'
import TabBar from '@webapp/components/tabBar'

import { SurveyInfoBasicForm } from './SurveyInfoBasicForm'
import { SurveyConfigurationEditor } from './SurveyConfigurationEditor'
import { SurveyUserExtraPropDefsEditor } from './SurveyUserExtraPropDefsEditor'

import { useSurveyInfoForm } from './store'
import { SurveyInfoSampleBasedImageInterpretation } from './SurveyInfoSampleBasedImageInterpretation'

const SurveyInfo = () => {
  const readOnly = !useAuthCanEditSurvey()
  const i18n = useI18n()
  const isSystemAdmin = useUserIsSystemAdmin()

  const {
    userExtraPropDefs,
    sampleBasedImageInterpretationEnabled,
    samplingPolygon,
    setCycles,
    setDefaultCycleKey,
    setDescriptions,
    setFieldManualLinks,
    setLabels,
    setLanguages,
    setName,
    setSamplingPolygon,
    setSampleBasedImageInterpretationEnabled,
    setSrs,
    setUserExtraPropDefs,
    getFieldValidation,
    saveProps,
    ...surveyInfoObject
  } = useSurveyInfoForm()

  return (
    <div className="home-survey-info">
      <TabBar
        tabs={[
          {
            key: 'basicInfo',
            component: SurveyInfoBasicForm,
            label: i18n.t('homeView.surveyInfo.basic'),
            props: {
              getFieldValidation,
              setCycles,
              setDefaultCycleKey,
              setDescriptions,
              setFieldManualLinks,
              setLabels,
              setLanguages,
              setName,
              setSrs,
              surveyInfoObject,
            },
          },
          {
            key: 'sampleBasedInterpretation',
            component: SurveyInfoSampleBasedImageInterpretation,
            label: i18n.t('homeView.surveyInfo.sampleBasedImageInterpretation'),
            props: {
              getFieldValidation,
              sampleBasedImageInterpretationEnabled,
              samplingPolygon,
              setSampleBasedImageInterpretationEnabled,
              setSamplingPolygon,
            },
          },
          ...(ProcessUtils.ENV.experimentalFeatures
            ? [
                {
                  key: 'extraProps',
                  component: SurveyUserExtraPropDefsEditor,
                  label: i18n.t('homeView.surveyInfo.userExtraProps.title'),
                  props: {
                    extraPropDefs: userExtraPropDefs,
                    onExtraPropDefsChange: setUserExtraPropDefs,
                  },
                },
              ]
            : []),
          ...(isSystemAdmin
            ? [
                {
                  key: 'configuration',
                  component: SurveyConfigurationEditor,
                  label: i18n.t('homeView.surveyInfo.configuration.title'),
                },
              ]
            : []),
        ]}
      />

      {!readOnly && (
        <ButtonSave className="survey-info-save-btn" onClick={saveProps} testId={TestId.surveyInfo.saveBtn} />
      )}
    </div>
  )
}

export default SurveyInfo
