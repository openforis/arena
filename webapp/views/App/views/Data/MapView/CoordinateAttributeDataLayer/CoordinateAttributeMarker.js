import React, { useEffect, useRef } from 'react'
import { CircleMarker } from 'react-leaflet'
import PropTypes from 'prop-types'

import { PointFactory } from '@openforis/arena-core'

import { CoordinateAttributePopUp } from './CoordinateAttributePopUp'
import { CoordinateAttributePolygon } from './CoordinateAttributePolygon'
import { useMapContextOptions } from '@webapp/components/Map/MapContext'
import { MarkerTooltip } from '../common/MarkerTooltip'

const markerRadius = 10
const fillOpacity = 0.5

export const CoordinateAttributeMarker = (props) => {
  const {
    attributeDef,
    markersColor,
    onRecordEditClick,
    pointFeature,
    getNextPoint,
    getPreviousPoint,
    onPopupClose,
    openPopupOfPoint,
    popupOpen,
    setMarkerByParentUuid,
  } = props

  const { recordUuid, parentUuid, point, ancestorsKeys } = pointFeature.properties
  const [longitude, latitude] = pointFeature.geometry.coordinates

  const pointLatLong = PointFactory.createInstance({ x: longitude, y: latitude, srs: '4326' })

  const circleRef = useRef(null)

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
    setMarkerByParentUuid?.({ parentUuid, marker: circleMarker })

    if (popupOpen) {
      circleMarker.openPopup()
    }
  }, [circleRef, parentUuid, popupOpen, setMarkerByParentUuid, showLocationMarkers, showMarkersLabels])

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
        eventHandlers={{ popupclose: onPopupClose }}
      >
        {showMarkersLabels && <MarkerTooltip color={markersColor}>{ancestorsKeys.join(' - ')}</MarkerTooltip>}

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
          openPopupOfPoint={openPopupOfPoint}
        />
      </CircleMarker>
    </div>
  )
}

CoordinateAttributeMarker.propTypes = {
  attributeDef: PropTypes.any,
  markersColor: PropTypes.any,
  onRecordEditClick: PropTypes.any,
  pointFeature: PropTypes.any,
  getNextPoint: PropTypes.func,
  getPreviousPoint: PropTypes.func,
  onPopupClose: PropTypes.func,
  openPopupOfPoint: PropTypes.func,
  popupOpen: PropTypes.bool,
  setMarkerByParentUuid: PropTypes.func,
}
