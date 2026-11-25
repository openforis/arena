import * as Survey from '@core/survey/survey'
import { Checkbox } from '@webapp/components/form'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import PreloadedMapLayersEditor from '../PreloadedMapLayersEditor'

import { AreasOfInterestEditor } from './AreasOfInterestEditor'
import SamplingPolygonEditor from './SamplingPolygonEditor'

type SurveyInfoMapProps = {
  areasOfInterest?: any[]
  canUseAnalysis?: boolean
  setAreasOfInterest: (...args: any[]) => any
  getFieldValidation: (...args: any[]) => any
  sampleBasedImageInterpretationEnabled?: boolean
  samplingPolygon?: Record<string, any>
  setSampleBasedImageInterpretationEnabled: (...args: any[]) => any
  setSamplingPolygon: (...args: any[]) => any
  preloadedMapLayersEnabled?: boolean
  preloadedMapLayers?: any[]
  setPreloadedMapLayersEnabled: (...args: any[]) => any
  setPreloadedMapLayers: (...args: any[]) => any
}

export const SurveyInfoMap = (props: SurveyInfoMapProps) => {
  const {
    areasOfInterest,
    canUseAnalysis = false,
    preloadedMapLayers,
    preloadedMapLayersEnabled,
    sampleBasedImageInterpretationEnabled,
    samplingPolygon,
    getFieldValidation,
    setAreasOfInterest,
    setSampleBasedImageInterpretationEnabled,
    setSamplingPolygon,
    setPreloadedMapLayersEnabled,
    setPreloadedMapLayers,
  } = props

  const readOnly = !useAuthCanEditSurvey()

  return (
    <div className="survey-info__map">
      {canUseAnalysis && (
        <Checkbox
          checked={sampleBasedImageInterpretationEnabled}
          disabled={readOnly}
          label="homeView:surveyInfo.sampleBasedImageInterpretationEnabled"
          onChange={setSampleBasedImageInterpretationEnabled}
          validation={getFieldValidation(Survey.infoKeys.sampleBasedImageInterpretationEnabled)}
        />
      )}
      {canUseAnalysis && sampleBasedImageInterpretationEnabled && (
        <SamplingPolygonEditor
          samplingPolygon={samplingPolygon}
          setSamplingPolygon={setSamplingPolygon}
          getFieldValidation={getFieldValidation}
          readOnly={readOnly}
        />
      )}
      <AreasOfInterestEditor
        areasOfInterest={areasOfInterest}
        readOnly={readOnly}
        setAreasOfInterest={setAreasOfInterest}
      />
      <Checkbox
        checked={preloadedMapLayersEnabled}
        disabled={readOnly}
        label="homeView:surveyInfo.preloadedMapLayers.enabledMessage"
        onChange={setPreloadedMapLayersEnabled}
        validation={getFieldValidation(Survey.infoKeys.preloadedMapLayersEnabled)}
      />
      {(preloadedMapLayersEnabled || preloadedMapLayers?.length > 0) && (
        <PreloadedMapLayersEditor
          preloadedMapLayers={preloadedMapLayers}
          setPreloadedMapLayers={setPreloadedMapLayers}
          readOnly={readOnly}
        />
      )}
    </div>
  )
}
