import React from 'react'

import { Map } from '@webapp/components/Map'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'

import { SamplingPointDataLayer } from './SamplingPointDataLayer'

export const MapView = () => {
  return (
    <SurveyDefsLoader draft validate={false}>
      <Map layers={<SamplingPointDataLayer />} />
    </SurveyDefsLoader>
  )
}
