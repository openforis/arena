import './SurveyInfo.scss'

import React from 'react'

import * as ProcessUtils from '@core/processUtils'

import { useAuthCanEditSurvey, useAuthCanUseAnalysis, useUserIsSystemAdmin } from '@webapp/store/user'
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
  const canUseAnalysis = useAuthCanUseAnalysis()

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

  const tabs = [
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
  ]
  if (canUseAnalysis) {
    tabs.push({
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
    })
  }
  if (!readOnly) {
    if (ProcessUtils.ENV.experimentalFeatures) {
      tabs.push({
        key: 'extraProps',
        component: SurveyUserExtraPropDefsEditor,
        label: 'homeView.surveyInfo.userExtraProps.title',
        props: {
          extraPropDefs: userExtraPropDefs,
          onExtraPropDefsUpdate: setUserExtraPropDefs,
        },
      })
    }
    if (isSystemAdmin) {
      tabs.push({
        key: 'configuration',
        component: SurveyConfigurationEditor,
        label: 'homeView.surveyInfo.configuration.title',
      })
    }
  }

  return (
    <div className="home-survey-info">
      <TabBar showTabs={tabs.length > 1} tabs={tabs} />
      {!readOnly && (
        <ButtonSave className="survey-info-save-btn" onClick={saveProps} testId={TestId.surveyInfo.saveBtn} />
      )}
    </div>
  )
}

export default SurveyInfo
