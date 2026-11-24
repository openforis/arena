import type React from 'react'

import { Colors } from '@webapp/utils/colors'
import { Tooltip } from 'react-leaflet'

const tooltipOpacity = 0.8

type MarkerTooltipProps = {
  color: string
  children: React.ReactNode
}

export const MarkerTooltip = (props: MarkerTooltipProps) => {
  const { children, color } = props

  const tooltipEventHandlers = {
    add: (e) => {
      const tooltip = e.target
      // set tooltip style
      const customStyle = {
        backgroundColor: color,
        color: Colors.getHighContrastTextColor(color),
      }
      Object.assign(tooltip._container.style, customStyle)
    },
  }

  return (
    <Tooltip
      eventHandlers={tooltipEventHandlers}
      direction="top"
      interactive
      offset={[0, -10]}
      opacity={tooltipOpacity}
      permanent
    >
      {children}
    </Tooltip>
  )
}
