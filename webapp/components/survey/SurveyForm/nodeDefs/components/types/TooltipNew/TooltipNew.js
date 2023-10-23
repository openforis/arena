import React, { useCallback, useEffect, useRef, useState } from 'react'

import { TooltipPopper } from './TooltipPopper'

export const TooltipNew = (props) => {
  const { children, enterDelay, leaveDelay, placement, popperRenderer } = props

  const anchorRef = useRef(null)
  const transitionTimeoutIdRef = useRef(null)
  const [popperOpen, setPopperOpen] = useState(false)

  const clearTransitionTimeout = useCallback(() => {
    if (transitionTimeoutIdRef.current) {
      clearTimeout(transitionTimeoutIdRef.current)
    }
  }, [])

  useEffect(() => {
    return clearTransitionTimeout
  }, [clearTransitionTimeout])

  const openOrClosePopper = useCallback(
    ({ open, delay }) => {
      clearTransitionTimeout()

      if (delay > 0) {
        transitionTimeoutIdRef.current = setTimeout(() => {
          setPopperOpen(open)
        }, delay)
      } else {
        setPopperOpen(open)
      }
    },
    [clearTransitionTimeout]
  )

  const onMouseEnter = useCallback(() => {
    openOrClosePopper({ delay: enterDelay, open: true })
  }, [openOrClosePopper, enterDelay])

  const onMouseLeave = useCallback(() => {
    openOrClosePopper({ delay: leaveDelay, open: false })
  }, [openOrClosePopper, leaveDelay])

  return (
    <>
      <div onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} ref={anchorRef}>
        {children}
      </div>

      {popperOpen && (
        <TooltipPopper anchorEl={anchorRef.current} open={popperOpen} placement={placement}>
          {popperRenderer(props)}
        </TooltipPopper>
      )}
    </>
  )
}

TooltipNew.defaultProps = {
  enterDelay: 400,
  leaveDelay: 0,
  placement: 'top',
}
