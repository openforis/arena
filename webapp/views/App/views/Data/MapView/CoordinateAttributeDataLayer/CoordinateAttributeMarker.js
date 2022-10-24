import React, { useEffect, useRef } from 'react'
import { CircleMarker, Tooltip } from 'react-leaflet'
import PropTypes from 'prop-types'

import { PointFactory } from '@openforis/arena-core'

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
    getNextPoint,
    getPreviousPoint,
    openPopupOfUuid,
    setRef,
  } = props

  ancestorsKeys.propTypes = {
    join: PropTypes.any,
  }

  const pointLatLong = PointFactory.createInstance({ x: longitude, y: latitude, srs: '4326' })

  const circleRef = useRef()

  const options = useMapContextOptions()
  const { showMarkersLabels, showLocationMarkers } = options

  useEffect(() => {
    const circleMarker = circleRef.current
    circleMarker.setStyle({
      fill: showLocationMarkers,
      stroke: showLocationMarkers,
    })
    if (showMarkersLabels && !circleMarker.isTooltipOpen()) {
      circleMarker.toggleTooltip()
    }
    setRef(parentUuid, circleRef)
  }, [circleRef, showLocationMarkers, showMarkersLabels])

  const tooltipEventHandlers = {
    add: (e) => {
      const tooltip = e.target
      // set tooltip style
      const customStyle = {
        backgroundColor: markersColor,
        color: Colors.getHighContrastTextColor(markersColor),
      }
      Object.assign(tooltip._container.style, customStyle)
    },
  }
  return (
    <div>
      <CoordinateAttributePolygon latitude={latitude} longitude={longitude} />
      <CircleMarker
        ref={circleRef}
        center={[latitude, longitude]}
        radius={markerRadius}
        color={markersColor}
        fillColor={markersColor}
        fillOpacity={fillOpacity}
      >
        {showMarkersLabels && (
          <Tooltip
            eventHandlers={tooltipEventHandlers}
            direction="top"
            interactive
            offset={[0, -10]}
            opacity={tooltipOpacity}
            permanent
          >
            {ancestorsKeys.join(' - ')}
          </Tooltip>
        )}
        <CoordinateAttributePopUp
          attributeDef={attributeDef}
          point={point}
          pointLatLong={pointLatLong}
          recordUuid={recordUuid}
          parentUuid={parentUuid}
          ancestorsKeys={ancestorsKeys}
          onRecordEditClick={onRecordEditClick}
          getNextPoint={getNextPoint}
          getPreviousPoint={getPreviousPoint}
          openPopupOfUuid={openPopupOfUuid}
        />
      </CircleMarker>
    </div>
  )
}

CoordinateAttributeMarker.propTypes = {
  ancestorsKeys: PropTypes.array,
  attributeDef: PropTypes.any,
  latitude: PropTypes.any,
  longitude: PropTypes.any,
  markersColor: PropTypes.any,
  onRecordEditClick: PropTypes.any,
  parentUuid: PropTypes.any,
  point: PropTypes.any,
  recordUuid: PropTypes.any,
  getNextPoint: PropTypes.func,
  getPreviousPoint: PropTypes.func,
  openPopupOfUuid: PropTypes.func,
  setRef: PropTypes.func,
}
