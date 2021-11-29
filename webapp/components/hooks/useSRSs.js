import { useEffect, useState } from 'react'

import { SRSs } from '@openforis/arena-core'

export const useSRSs = () => {
  const [srssInitialized, setSrssInitialized] = useState(false)

  // initialize SRSs at component mount
  useEffect(() => {
    ;(async () => {
      await SRSs.init()
      setSrssInitialized(true)
    })()
  }, [])

  return { srssInitialized }
}
