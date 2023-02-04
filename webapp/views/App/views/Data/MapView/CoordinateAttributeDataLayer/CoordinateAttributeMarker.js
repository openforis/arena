import React, { useEffect, useRef } from 'react'
import { CircleMarker } from 'react-leaflet'
import PropTypes from 'prop-types'

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
    flyToNextPoint,
    flyToPreviousPoint,
    onPopupClose,
    popupOpen,
    setMarkerByKey,
  } = props

  const { ancestorsKeys, key } = pointFeature.properties
  const [longitude, latitude] = pointFeature.geometry.coordinates

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
    setMarkerByKey?.({ key, marker: circleMarker })

    if (popupOpen) {
      circleMarker.openPopup()
    }

    return () => {
      setMarkerByKey?.({ key, marker: null })
    }
  }, [circleRef, key, popupOpen, setMarkerByKey, showLocationMarkers, showMarkersLabels])

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
          flyToNextPoint={flyToNextPoint}
          flyToPreviousPoint={flyToPreviousPoint}
          onRecordEditClick={onRecordEditClick}
          pointFeature={pointFeature}
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
  flyToNextPoint: PropTypes.func,
  flyToPreviousPoint: PropTypes.func,
  onPopupClose: PropTypes.func,
  popupOpen: PropTypes.bool,
  setMarkerByKey: PropTypes.func,
}
