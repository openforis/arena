import React, { useCallback, useMemo } from 'react'
import { CircleMarker, GeoJSON } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as Survey from '@core/survey/survey'
import * as ObjectUtils from '@core/objectUtils'

import { useSurveyInfo } from '@webapp/store/survey'

import { MarkerTooltip, useLayerMarker } from '../common'
import { CoordinateAttributePopUp } from './CoordinateAttributePopUp'
import { CoordinateAttributePolygon } from './CoordinateAttributePolygon'

const markerRadius = 10
const fillOpacity = 0.5

export const CoordinateAttributeMarker = (props) => {
  const {
    attributeDef,
    data,
    flyToPoint,
    flyToNextPoint,
    flyToPreviousPoint,
    markersColor,
    onPopupClose,
    onRecordEditClick,
    popupOpen,
    setMarkerByKey,
  } = props

  const { ancestorsKeys, data: innerData, key } = data.properties
  const [longitude, latitude] = data.geometry.coordinates

  const surveyInfo = useSurveyInfo()
  const { markerRef, showMarkersLabels } = useLayerMarker({ key, popupOpen, setMarkerByKey })

  const onDoubleClick = useCallback(() => {
    flyToPoint(data)
  }, [flyToPoint, data])

  const content = useMemo(
    () => (
      <>
        {showMarkersLabels && <MarkerTooltip color={markersColor}>{ancestorsKeys.join(' - ')}</MarkerTooltip>}

        <CoordinateAttributePopUp
          attributeDef={attributeDef}
          flyToNextPoint={flyToNextPoint}
          flyToPreviousPoint={flyToPreviousPoint}
          onRecordEditClick={onRecordEditClick}
          pointFeature={data}
        />
      </>
    ),
    [
      ancestorsKeys,
      attributeDef,
      data,
      flyToNextPoint,
      flyToPreviousPoint,
      markersColor,
      onRecordEditClick,
      showMarkersLabels,
    ]
  )

  const setRef = useCallback(
    (ref) => {
      markerRef.current = ref
      setMarkerByKey({ key, marker: ref })
    },
    [key, markerRef, setMarkerByKey]
  )

  const eventHandlers = useMemo(
    () => ObjectUtils.keepNonEmptyProps({ dblclick: onDoubleClick, popupclose: onPopupClose }),
    [onDoubleClick, onPopupClose]
  )

  return (
    <div>
      {Survey.isSampleBasedImageInterpretationEnabled(surveyInfo) && (
        <CoordinateAttributePolygon latitude={latitude} longitude={longitude} />
      )}
      {/* {!innerData && ( */}
      <CircleMarker
        center={[latitude, longitude]}
        color={markersColor}
        eventHandlers={eventHandlers}
        fillColor={markersColor}
        fillOpacity={fillOpacity}
        radius={markerRadius}
        ref={setRef}
      >
        {content}
      </CircleMarker>
      {/* )} */}

      {innerData && (
        <GeoJSON data={innerData} eventHandlers={eventHandlers} color={markersColor} ref={setRef}>
          {content}
        </GeoJSON>
      )}
    </div>
  )
}

CoordinateAttributeMarker.propTypes = {
  attributeDef: PropTypes.any,
  data: PropTypes.any,
  flyToPoint: PropTypes.func,
  flyToNextPoint: PropTypes.func,
  flyToPreviousPoint: PropTypes.func,
  markersColor: PropTypes.any,
  onPopupClose: PropTypes.func,
  onRecordEditClick: PropTypes.any,
  popupOpen: PropTypes.bool,
  setMarkerByKey: PropTypes.func,
}
