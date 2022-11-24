import { useEffect, useState } from 'react'

import { Points } from '@openforis/arena-core'

import * as API from '@webapp/service/api'

export const useElevation = (point, active = true) => {
  const [elevation, setElevation] = useState('...')

  useEffect(() => {
    const getElevation = async (point) => {
      const pointLatLong = Points.toLatLong(point)
      const { y: lat, x: lng } = pointLatLong
      const elev = await API.fetchElevation({ lat, lng })
      setElevation(elev === null ? 'error' : elev)
    }
    if (active) {
      getElevation(point)
    }
  }, [point, active])

  return elevation
}
