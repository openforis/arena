import { useEffect, useState } from 'react'

import { Points } from '@openforis/arena-core'

import * as Survey from '@core/survey/survey'

import * as API from '@webapp/service/api'

export const useElevation = ({ survey, point, active = true }) => {
  const surveyId = Survey.getId(survey)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const srsIndex = Survey.getSRSIndex(surveyInfo)

  const pointLatLng = Points.toLatLong(point, srsIndex)
  const { y: lat, x: lng } = pointLatLng

  const [elevation, setElevation] = useState('...')

  useEffect(() => {
    const fetchElevation = async () => {
      const elev = await API.fetchElevation({ surveyId, lat, lng })
      setElevation(elev === null ? 'error' : elev)
    }
    if (active) {
      fetchElevation()
    }
  }, [active, lat, lng, surveyId])

  return elevation
}
