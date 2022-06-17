import { useEffect, useState } from 'react'

import { SRSs } from '@openforis/arena-core'

import useIsMounted from './useIsMountedRef'

export const useSRSs = () => {
  const [srssInitialized, setSrssInitialized] = useState(false)

  const isMountedRef = useIsMounted()

  // initialize SRSs at component mount
  useEffect(() => {
    ;(async () => {
      await SRSs.init()
      if (isMountedRef.current) {
        setSrssInitialized(true)
      }
    })()
  }, [])

  return { srssInitialized }
}
