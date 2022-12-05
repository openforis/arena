import { useEffect, useState } from 'react'

import * as API from '@webapp/service/api'
import { Points } from '@openforis/arena-core'

export const useElevation = (point, active = true) => {
  const pointLatLng = Points.toLatLong(point)
  const { y: lat, x: lng } = pointLatLng

  const [elevation, setElevation] = useState('...')

  useEffect(() => {
    const fetchElevation = async () => {
      const elev = await API.fetchElevation({ lat, lng })
      setElevation(elev === null ? 'error' : elev)
    }
    if (active) {
      fetchElevation()
    }
  }, [active, lat, lng])

  return elevation
}
