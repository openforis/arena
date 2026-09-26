import './SurveyInfo.scss'

import * as ObjectUtils from '@core/objectUtils'

import { useSurveyInfo } from '@webapp/store/survey'
import { useAuthCanEditSurvey, useAuthCanUseAnalysis, useUserIsSystemAdmin } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { ButtonSave } from '@webapp/components'
import TabBar from '@webapp/components/tabBar'
import { SurveyUserExtraPropDefsEditor } from '@webapp/components/survey/SurveyUserExtraPropDefsEditor'

import { SurveyInfoBasicForm } from './SurveyInfoBasicForm'
import { SurveyInfoBrandingForm } from './SurveyInfoBrandingForm'
import { SurveyConfigurationEditor } from './SurveyConfigurationEditor'
import { SurveyInfoDocuments } from './SurveyInfoDocuments'
import { SurveyInfoMap } from './SurveyInfoMap'

import { useSurveyInfoForm } from './store'
import { SurveySecurityEditor } from './surveySecurityEditor'

const SurveyInfoForm = () => {
  const readOnly = !useAuthCanEditSurvey()
  const isSystemAdmin = useUserIsSystemAdmin()
  const canUseAnalysis = useAuthCanUseAnalysis()

  const {
    preloadedMapLayers,
    preloadedMapLayersEnabled,
    sampleBasedImageInterpretationEnabled,
    samplingPolygon,
    security,
    surveyDocImages,
    surveyDocOptions,
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
    setSurveyDocImages,
    setSurveyDocOptions,
    setUserExtraPropDefs,
    setBranding,
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
  if (!readOnly) {
    tabs.push({
      key: 'branding',
      component: SurveyInfoBrandingForm,
      label: 'homeView:surveyInfo.branding.title',
      props: {
        branding: surveyInfoObject.branding || {},
        setBranding,
        readOnly,
        labels: surveyInfoObject.labels,
        descriptions: surveyInfoObject.descriptions,
        name: surveyInfoObject.name,
      },
    })
  }
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
    tabs.push({
      key: 'documents',
      component: SurveyInfoDocuments,
      label: 'homeView:surveyInfo.surveyDocLayout.tabTitle',
      props: {
        surveyDocImages,
        setSurveyDocImages,
        surveyDocOptions,
        setSurveyDocOptions,
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

const SurveyInfo = () => {
  const surveyInfo = useSurveyInfo()
  const surveyUuid = ObjectUtils.getUuid(surveyInfo)

  // the form state is initialized with the survey info: render the form only once the survey info has been loaded
  // (e.g. when the page is reloaded) and initialize it again if the current survey changes
  if (!surveyUuid) return null

  return <SurveyInfoForm key={surveyUuid} />
}

export default SurveyInfo
