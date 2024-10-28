import './SurveyInfo.scss'

import React from 'react'

import * as ProcessUtils from '@core/processUtils'

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
            label: 'homeView.surveyInfo.basic',
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
            label: 'homeView.surveyInfo.sampleBasedImageInterpretation',
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
                  label: 'homeView.surveyInfo.userExtraProps.title',
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
                  label: 'homeView.surveyInfo.configuration.title',
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
