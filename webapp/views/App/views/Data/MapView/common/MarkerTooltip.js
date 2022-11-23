import React from 'react'
import PropTypes from 'prop-types'

import { Colors } from '@webapp/utils/colors'
import { Tooltip } from 'react-leaflet'

const tooltipOpacity = 0.6

export const MarkerTooltip = (props) => {
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

MarkerTooltip.propTypes = {
  color: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}
