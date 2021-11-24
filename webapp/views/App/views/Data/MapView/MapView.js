import React, { useEffect } from 'react'

import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'

import { Map } from '@webapp/components/Map'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'

import { SamplingPointDataLayer } from './SamplingPointDataLayer'

export const MapView = (props) => {
  const survey = useSurvey()

  useEffect(() => {
    const samplingPointCategory = Survey.getCategoryByName(Survey.samplingPointDataCategoryName)(survey)
    if (samplingPointCategory) {
    }
  }, [])

  return (
    <SurveyDefsLoader draft validate={false}>
      <Map layers={<SamplingPointDataLayer />} />
    </SurveyDefsLoader>
  )
}
