import { useEffect, useMemo, useState } from 'react'

import { Objects, Points } from '@openforis/arena-core'

import * as API from '@webapp/service/api'
import { useSurveyId, useSurveySrsIndex } from '@webapp/store/survey'

export const useElevation = ({ point, active = true }) => {
  const surveyId = useSurveyId()
  const srsIndex = useSurveySrsIndex()

  const pointLatLng = useMemo(() => (point ? Points.toLatLong(point, srsIndex) : null), [point, srsIndex])
  // the effect depends on the coordinates: callers may pass a new point object on every render
  const { y: lat, x: lng } = pointLatLng ?? {}

  const [elevation, setElevation] = useState('...')

  useEffect(() => {
    let cancelled = false

    const fetchElevation = async () => {
      const _elevation = await API.fetchElevation({ surveyId, lat, lng })
      if (!cancelled) {
        setElevation(_elevation === null ? 'error' : _elevation)
      }
    }
    if (!active || !surveyId || Objects.isNil(lat) || Objects.isNil(lng)) return undefined

    void fetchElevation()

    return () => {
      cancelled = true
      setElevation('...')
    }
  }, [active, lat, lng, surveyId])

  return elevation
}
