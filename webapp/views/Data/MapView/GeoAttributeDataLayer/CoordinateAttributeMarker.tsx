import { useCallback, useMemo } from 'react'
import { CircleMarker, GeoJSON } from 'react-leaflet'

import type { ArenaAnyNodeDef } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'
import * as Survey from '@core/survey/survey'
import { useSurveyInfo } from '@webapp/store/survey'
import { MarkerTooltip, useLayerMarker } from '../common'
import type {
  GeoAttributePointFeature,
  GeoAttributePopupRenderer,
  MapPointMarker,
  RecordEditClickHandler,
  SetMarkerByKey,
} from '../common/mapPointTypes'
import type { FlyToPointFunction } from '../common/useFlyToPoint'

import { CoordinateAttributePolygon } from './CoordinateAttributePolygon'
import { CoordinateAttributePopUp } from './CoordinateAttributePopUp'

const markerRadius = 10
const fillOpacity = 0.5

type CoordinateAttributeMarkerProps = {
  attributeDef: ArenaAnyNodeDef
  data: GeoAttributePointFeature
  flyToPoint?: FlyToPointFunction<GeoAttributePointFeature>
  flyToNextPoint?: FlyToPointFunction<GeoAttributePointFeature>
  flyToPreviousPoint?: FlyToPointFunction<GeoAttributePointFeature>
  markersColor?: string
  onPopupClose?: () => void
  onPopupOpen?: (key: string) => void
  onRecordEditClick?: RecordEditClickHandler
  popupOpen?: boolean
  renderPopup?: GeoAttributePopupRenderer | null
  setMarkerByKey?: SetMarkerByKey
}

export const CoordinateAttributeMarker = (props: CoordinateAttributeMarkerProps) => {
  const {
    attributeDef,
    data,
    flyToPoint,
    flyToNextPoint,
    flyToPreviousPoint,
    markersColor,
    onPopupClose,
    onPopupOpen,
    onRecordEditClick,
    popupOpen,
    renderPopup = null,
    setMarkerByKey,
  } = props

  const { ancestorsKeys, data: innerData, key } = data.properties
  const [longitude, latitude] = data.geometry.coordinates

  const surveyInfo = useSurveyInfo()
  const { markerRef, showMarkersLabels } = useLayerMarker({ key, popupOpen, setMarkerByKey })

  const onDoubleClick = useCallback(() => {
    flyToPoint(data)
  }, [flyToPoint, data])

  const handlePopupOpen = useCallback(() => {
    onPopupOpen?.(key)
  }, [key, onPopupOpen])

  const content = useMemo(
    () => (
      <>
        {showMarkersLabels && <MarkerTooltip color={markersColor}>{ancestorsKeys.join(' - ')}</MarkerTooltip>}

        {renderPopup ? (
          renderPopup({ attributeDef, pointFeature: data, flyToNextPoint, flyToPreviousPoint })
        ) : (
          <CoordinateAttributePopUp
            attributeDef={attributeDef}
            flyToNextPoint={flyToNextPoint}
            flyToPreviousPoint={flyToPreviousPoint}
            onRecordEditClick={onRecordEditClick}
            pointFeature={data}
          />
        )}
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
      renderPopup,
      showMarkersLabels,
    ]
  )

  const setRef = useCallback(
    (ref: MapPointMarker | null) => {
      markerRef.current = ref
      setMarkerByKey({ key, marker: ref })
    },
    [key, markerRef, setMarkerByKey]
  )

  const eventHandlers = useMemo(
    () =>
      ObjectUtils.keepNonEmptyProps({ dblclick: onDoubleClick, popupclose: onPopupClose, popupopen: handlePopupOpen }),
    [handlePopupOpen, onDoubleClick, onPopupClose]
  )

  const circleMarkerPathOptions = useMemo(
    () => ({ color: markersColor, fillColor: markersColor, fillOpacity }),
    [markersColor]
  )

  const geoJsonStyle = useMemo(() => ({ color: markersColor }), [markersColor])

  return (
    <div>
      {Survey.isSampleBasedImageInterpretationEnabled(surveyInfo) && (
        <CoordinateAttributePolygon latitude={latitude} longitude={longitude} />
      )}
      {!innerData && (
        <CircleMarker
          center={[latitude, longitude]}
          eventHandlers={eventHandlers}
          pathOptions={circleMarkerPathOptions}
          radius={markerRadius}
          ref={setRef}
        >
          {content}
        </CircleMarker>
      )}

      {innerData && (
        <GeoJSON data={innerData} eventHandlers={eventHandlers} style={geoJsonStyle} ref={setRef}>
          {content}
        </GeoJSON>
      )}
    </div>
  )
}
