import React from 'react'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { Checkbox } from '@webapp/components/form'

import { useAuthCanEditSurvey } from '@webapp/store/user'

import SamplingPolygonEditor from './SamplingPolygonEditor'

export const SurveyInfoSampleBasedImageInterpretation = (props) => {
  const {
    getFieldValidation,
    sampleBasedImageInterpretationEnabled,
    samplingPolygon,
    setSampleBasedImageInterpretationEnabled,
    setSamplingPolygon,
  } = props

  const readOnly = !useAuthCanEditSurvey()

  return (
    <div className="sample-based-image-interpretation">
      <Checkbox
        checked={sampleBasedImageInterpretationEnabled}
        disabled={readOnly}
        label="homeView.surveyInfo.sampleBasedImageInterpretationEnabled"
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
  )
}

SurveyInfoSampleBasedImageInterpretation.propTypes = {
  getFieldValidation: PropTypes.func.isRequired,
  sampleBasedImageInterpretationEnabled: PropTypes.bool,
  samplingPolygon: PropTypes.object,
  setSampleBasedImageInterpretationEnabled: PropTypes.func.isRequired,
  setSamplingPolygon: PropTypes.func.isRequired,
}
