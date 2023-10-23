import React, { useState } from 'react'
import { Popper } from '@mui/material'

export const TooltipPopper = (props) => {
  const { anchorEl, open, children, placement } = props
  const [arrowRef, setArrowRef] = useState(null)

  return (
    <Popper
      anchorEl={anchorEl}
      disablePortal={false}
      modifiers={[
        {
          name: 'flip',
          enabled: true,
          options: {
            altBoundary: true,
            rootBoundary: 'document',
            padding: 8,
          },
        },
        {
          name: 'preventOverflow',
          enabled: true,
          options: {
            altAxis: true,
            altBoundary: true,
            tether: true,
            rootBoundary: 'document',
            padding: 8,
          },
        },
        {
          name: 'arrow',
          enabled: true,
          options: {
            element: arrowRef,
          },
        },
      ]}
      open={open}
      placement={placement}
    >
      <span className="popper-arrow" ref={setArrowRef} />
      {children}
    </Popper>
  )
}
