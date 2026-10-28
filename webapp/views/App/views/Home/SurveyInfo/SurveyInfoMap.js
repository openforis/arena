import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { Checkbox } from '@webapp/components/form'

import { useSystemConfigExperimentalFeatures } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'

import SamplingPolygonEditor from './SamplingPolygonEditor'
import { AreaOfInterestEditor } from './AreaOfInterestEditor'
import PreloadedMapLayersEditor from '../PreloadedMapLayersEditor'

export const SurveyInfoMap = (props) => {
  const {
    areaOfInterest,
    canUseAnalysis = false,
    preloadedMapLayers,
    preloadedMapLayersEnabled,
    sampleBasedImageInterpretationEnabled,
    samplingPolygon,
    getFieldValidation,
    setAreaOfInterest,
    setSampleBasedImageInterpretationEnabled,
    setSamplingPolygon,
    setPreloadedMapLayersEnabled,
    setPreloadedMapLayers,
  } = props

  const readOnly = !useAuthCanEditSurvey()
  const experimentalFeatures = useSystemConfigExperimentalFeatures()

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
      <AreaOfInterestEditor
        areaOfInterest={areaOfInterest}
        readOnly={readOnly}
        setAreaOfInterest={setAreaOfInterest}
        validation={getFieldValidation(Survey.infoKeys.areaOfInterest)}
      />
      {experimentalFeatures && (
        <>
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
        </>
      )}
    </div>
  )
}

SurveyInfoMap.propTypes = {
  areaOfInterest: PropTypes.object,
  canUseAnalysis: PropTypes.bool,
  setAreaOfInterest: PropTypes.func.isRequired,
  getFieldValidation: PropTypes.func.isRequired,
  sampleBasedImageInterpretationEnabled: PropTypes.bool,
  samplingPolygon: PropTypes.object,
  setSampleBasedImageInterpretationEnabled: PropTypes.func.isRequired,
  setSamplingPolygon: PropTypes.func.isRequired,
  preloadedMapLayersEnabled: PropTypes.bool,
  preloadedMapLayers: PropTypes.array,
  setPreloadedMapLayersEnabled: PropTypes.func.isRequired,
  setPreloadedMapLayers: PropTypes.func.isRequired,
}
