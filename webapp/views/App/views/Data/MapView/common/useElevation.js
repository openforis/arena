import { useEffect, useMemo, useState } from 'react'

import { Points } from '@openforis/arena-core'

import * as API from '@webapp/service/api'
import { useSurveyId, useSurveySrsIndex } from '@webapp/store/survey'

export const useElevation = ({ point, active = true }) => {
  const surveyId = useSurveyId()
  const srsIndex = useSurveySrsIndex()

  const pointLatLng = useMemo(() => (point ? Points.toLatLong(point, srsIndex) : null), [point, srsIndex])

  const [elevation, setElevation] = useState('...')

  useEffect(() => {
    const fetchElevation = async () => {
      const { y: lat, x: lng } = pointLatLng ?? {}
      const _elevation = await API.fetchElevation({ surveyId, lat, lng })
      setElevation(_elevation === null ? 'error' : _elevation)
    }
    if (active && pointLatLng) {
      fetchElevation()
    } else {
      setElevation('...')
    }
  }, [active, pointLatLng, surveyId])

  return elevation
}
