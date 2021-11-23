import React, { useEffect } from 'react'

import * as Survey from '@core/survey/survey'

import { useSurvey } from '@webapp/store/survey'

export const MapView = (props) => {
  const survey = useSurvey()

  useEffect(() => {
    const samplingPointCategory = Survey.getCategoryByName(Survey.samplingPointDataCategoryName)(survey)
    if (samplingPointCategory) {
    }
  }, [])

  return null
}
