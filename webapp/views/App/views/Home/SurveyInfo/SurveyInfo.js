import './SurveyInfo.scss'

import React from 'react'

import { useAuthCanEditSurvey, useAuthCanUseAnalysis, useUserIsSystemAdmin } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { ButtonSave } from '@webapp/components'
import TabBar from '@webapp/components/tabBar'
import { SurveyUserExtraPropDefsEditor } from '@webapp/components/survey/SurveyUserExtraPropDefsEditor'

import { SurveyInfoBasicForm } from './SurveyInfoBasicForm'
import { SurveyConfigurationEditor } from './SurveyConfigurationEditor'
import { SurveyInfoMap } from './SurveyInfoMap'

import { useSurveyInfoForm } from './store'
import { SurveySecurityEditor } from './surveySecurityEditor'

const SurveyInfo = () => {
  const readOnly = !useAuthCanEditSurvey()
  const isSystemAdmin = useUserIsSystemAdmin()
  const canUseAnalysis = useAuthCanUseAnalysis()

  const {
    preloadedMapLayers,
    preloadedMapLayersEnabled,
    sampleBasedImageInterpretationEnabled,
    samplingPolygon,
    security,
    userExtraPropDefs,

    setCycles,
    setDefaultCycleKey,
    setDescriptions,
    setFieldManualLinks,
    setLabels,
    setLanguages,
    setName,
    setPreloadedMapLayers,
    setPreloadedMapLayersEnabled,
    setSamplingPolygon,
    setSampleBasedImageInterpretationEnabled,
    setSecurity,
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
      label: 'homeView:surveyInfo.basic',
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
      component: SurveyInfoMap,
      label: 'homeView:surveyInfo.map',
      props: {
        getFieldValidation,
        sampleBasedImageInterpretationEnabled,
        samplingPolygon,
        setSampleBasedImageInterpretationEnabled,
        setSamplingPolygon,
        preloadedMapLayers,
        preloadedMapLayersEnabled,
        setPreloadedMapLayers,
        setPreloadedMapLayersEnabled,
      },
    })
  }
  if (!readOnly) {
    tabs.push(
      {
        key: 'extraProps',
        component: SurveyUserExtraPropDefsEditor,
        label: 'homeView:surveyInfo.userExtraProps.title',
        props: {
          extraPropDefs: userExtraPropDefs,
          onExtraPropDefsUpdate: setUserExtraPropDefs,
        },
      },
      {
        key: 'security',
        component: SurveySecurityEditor,
        label: 'homeView:surveyInfo.security.title',
        props: {
          security,
          onSecurityUpdate: setSecurity,
        },
      }
    )
    if (isSystemAdmin) {
      tabs.push({
        key: 'configuration',
        component: SurveyConfigurationEditor,
        label: 'homeView:surveyInfo.configuration.title',
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
