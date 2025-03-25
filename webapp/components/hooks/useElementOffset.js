import { useCallback, useState } from 'react'

import { useOnResize } from '@webapp/components/hooks'
import { elementOffset } from '@webapp/utils/domUtils'

export const useElementOffset = (elementRef) => {
  const [offset, setOffset] = useState(elementOffset(elementRef.current))

  const onResize = useCallback(() => {
    setOffset(elementOffset(elementRef.current))
  }, [elementRef])

  useOnResize(onResize, elementRef)

  return offset
}
