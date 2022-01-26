import React, { useCallback, useRef } from 'react'
import { CircleMarker, Tooltip } from 'react-leaflet'

import { Colors } from '@webapp/utils/colors'
import { CoordinateAttributePopUp } from './CoordinateAttributePopUp'
import { useMapContextOptions } from '@webapp/components/Map/MapContext'

const markerRadius = 10
const fillOpacity = 0.5
const tooltipOpacity = 0.6

export const CoordinateAttributeMarker = (props) => {
  const {
    ancestorsKeys,
    attributeDef,
    key,
    latitude,
    longitude,
    markersColor,
    onRecordEditClick,
    parentUuid,
    point,
    recordUuid,
  } = props

  const tooltipRef = useRef()

  const onTooltipOpen = useCallback(() => {
    // set tooltip style
    const customStyle = {
      backgroundColor: markersColor,
      color: Colors.getHighContrastTextColor(markersColor),
    }
    Object.assign(tooltipRef.current._container.style, customStyle)
  }, [tooltipRef])

  const options = useMapContextOptions()
  const { showMarkersLabels } = options

  return (
    <CircleMarker
      key={key}
      center={[latitude, longitude]}
      radius={markerRadius}
      color={markersColor}
      fillColor={markersColor}
      fillOpacity={fillOpacity}
    >
      {showMarkersLabels && (
        <Tooltip
          ref={tooltipRef}
          direction="top"
          offset={[0, -10]}
          opacity={tooltipOpacity}
          permanent
          onOpen={onTooltipOpen}
        >
          {ancestorsKeys.join(' - ')}
        </Tooltip>
      )}
      <CoordinateAttributePopUp
        attributeDef={attributeDef}
        point={point}
        recordUuid={recordUuid}
        parentUuid={parentUuid}
        ancestorsKeys={ancestorsKeys}
        onRecordEditClick={onRecordEditClick}
      />
    </CircleMarker>
  )
}
