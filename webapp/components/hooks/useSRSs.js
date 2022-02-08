import { useEffect, useState } from 'react'

import { SRSs } from '@openforis/arena-core'

import useIsMounted from './useIsMounted'

export const useSRSs = () => {
  const [srssInitialized, setSrssInitialized] = useState(false)

  const mounted = useIsMounted()

  // initialize SRSs at component mount
  useEffect(() => {
    ;(async () => {
      await SRSs.init()
      if (mounted) {
        setSrssInitialized(true)
      }
    })()
  }, [])

  return { srssInitialized }
}
