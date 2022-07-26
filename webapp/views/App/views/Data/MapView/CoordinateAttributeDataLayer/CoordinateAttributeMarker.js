import React, { useCallback, useRef } from 'react'
import { CircleMarker, Tooltip } from 'react-leaflet'
import PropTypes from 'prop-types'

import { Colors } from '@webapp/utils/colors'
import { CoordinateAttributePopUp } from './CoordinateAttributePopUp'
import { CoordinateAttributePolygon } from './CoordinateAttributePolygon'
import { useMapContextOptions } from '@webapp/components/Map/MapContext'

const markerRadius = 10
const fillOpacity = 0.5
const tooltipOpacity = 0.6

export const CoordinateAttributeMarker = (props) => {
  const {
    ancestorsKeys,
    attributeDef,
    latitude,
    longitude,
    markersColor,
    onRecordEditClick,
    parentUuid,
    point,
    recordUuid,
  } = props

  ancestorsKeys.propTypes = {
    join: PropTypes.any,
  }

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
    <div>
      <CoordinateAttributePolygon latitude={latitude} longitude={longitude} />
      <CircleMarker
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
    </div>
  )
}

CoordinateAttributeMarker.propTypes = {
  ancestorsKeys: PropTypes.any,
  attributeDef: PropTypes.any,
  latitude: PropTypes.any,
  longitude: PropTypes.any,
  markersColor: PropTypes.any,
  onRecordEditClick: PropTypes.any,
  parentUuid: PropTypes.any,
  point: PropTypes.any,
  recordUuid: PropTypes.any,
}
