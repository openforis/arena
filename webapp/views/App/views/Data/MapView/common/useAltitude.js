import { useEffect, useState } from 'react'

import { Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'

export const useAltitude = ({ survey, point, active = true }) => {
  const surveyId = Survey.getId(survey)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const srsIndex = Survey.getSRSIndex(surveyInfo)

  const pointLatLng = Points.toLatLong(point, srsIndex)
  const { y: lat, x: lng } = pointLatLng

  const [altitude, setAltitude] = useState('...')

  useEffect(() => {
    const fetchAltitude = async () => {
      const _altitude = await API.fetchAltitude({ surveyId, lat, lng })
      setAltitude(_altitude === null ? 'error' : _altitude)
    }
    if (active) {
      fetchAltitude()
    }
  }, [active, lat, lng, surveyId])

  return altitude
}
