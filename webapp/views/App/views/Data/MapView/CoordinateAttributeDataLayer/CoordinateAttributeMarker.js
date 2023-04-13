import React from 'react'
import { CircleMarker } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'

import { MarkerTooltip, useLayerMarker } from '../common'
import { CoordinateAttributePopUp } from './CoordinateAttributePopUp'
import { CoordinateAttributePolygon } from './CoordinateAttributePolygon'

import { useSurveyInfo } from '@webapp/store/survey'

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

  const surveyInfo = useSurveyInfo()
  const { markerRef, showMarkersLabels } = useLayerMarker({ key, popupOpen, setMarkerByKey })

  return (
    <div>
      {Survey.isSampleBasedImageInterpretationEnabled(surveyInfo) && (
        <CoordinateAttributePolygon latitude={latitude} longitude={longitude} />
      )}
      <CircleMarker
        ref={(ref) => {
          markerRef.current = ref
          setMarkerByKey({ key, marker: ref })
        }}
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
