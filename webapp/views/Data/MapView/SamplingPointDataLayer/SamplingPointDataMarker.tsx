import { useCallback, useMemo } from 'react'
import { CircleMarker } from 'react-leaflet'

import { MarkerTooltip, useLayerMarker } from '../common'
import type {
  CreateRecordFromSamplingPointDataItem,
  RecordEditClickHandler,
  SamplingPointFeature,
  SetMarkerByKey,
} from '../common/mapPointTypes'
import type { FlyToPointFunction } from '../common/useFlyToPoint'

import { SamplingPointDataItemPopup } from './SamplingPointDataItemPopup'

const markerRadius = 10

type SamplingPointDataMarkerProps = {
  createRecordFromSamplingPointDataItem: CreateRecordFromSamplingPointDataItem
  flyToPoint: FlyToPointFunction<SamplingPointFeature>
  flyToNextPoint: FlyToPointFunction<SamplingPointFeature>
  flyToPreviousPoint: FlyToPointFunction<SamplingPointFeature>
  markersColor?: string
  onPopupClose?: () => void
  onPopupOpen?: (key: string) => void
  onRecordEditClick: RecordEditClickHandler
  pointFeature: SamplingPointFeature
  popupOpen?: boolean
  setMarkerByKey: SetMarkerByKey
}

export const SamplingPointDataMarker = (props: SamplingPointDataMarkerProps) => {
  const {
    createRecordFromSamplingPointDataItem,
    flyToPoint,
    flyToNextPoint,
    flyToPreviousPoint,
    markersColor,
    onPopupClose,
    onPopupOpen,
    onRecordEditClick,
    pointFeature,
    popupOpen,
    setMarkerByKey,
  } = props
  const { geometry, properties } = pointFeature
  const { itemCodes, key } = properties
  const [longitude, latitude] = geometry.coordinates

  const { markerRef, showMarkersLabels } = useLayerMarker({ key, popupOpen, setMarkerByKey })

  const onDoubleClick = useCallback(() => {
    flyToPoint(pointFeature)
  }, [flyToPoint, pointFeature])

  const handlePopupOpen = useCallback(() => {
    onPopupOpen?.(key)
  }, [key, onPopupOpen])

  const pathOptions = useMemo(
    () => ({ color: markersColor, fillColor: markersColor, fillOpacity: 0.5 }),
    [markersColor]
  )

  return (
    <CircleMarker
      center={[latitude, longitude]}
      radius={markerRadius}
      pathOptions={pathOptions}
      ref={(ref) => {
        markerRef.current = ref
        setMarkerByKey({ key, marker: ref })
      }}
      eventHandlers={{ dblclick: onDoubleClick, popupclose: onPopupClose, popupopen: handlePopupOpen }}
    >
      {showMarkersLabels && <MarkerTooltip color={markersColor}>{itemCodes.join(' - ')}</MarkerTooltip>}

      <SamplingPointDataItemPopup
        pointFeature={pointFeature}
        flyToNextPoint={flyToNextPoint}
        flyToPreviousPoint={flyToPreviousPoint}
        onRecordEditClick={onRecordEditClick}
        createRecordFromSamplingPointDataItem={createRecordFromSamplingPointDataItem}
      />
    </CircleMarker>
  )
}
