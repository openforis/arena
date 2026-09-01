import React, { useCallback, useMemo } from 'react'
import { CircleMarker } from 'react-leaflet'
import PropTypes from 'prop-types'

import { MarkerTooltip, useLayerMarker } from '../common'
import { SamplingPointDataItemPopup } from './SamplingPointDataItemPopup'

const markerRadius = 10

export const SamplingPointDataMarker = (props) => {
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

SamplingPointDataMarker.propTypes = {
  createRecordFromSamplingPointDataItem: PropTypes.func.isRequired,
  flyToPoint: PropTypes.func.isRequired,
  flyToNextPoint: PropTypes.func.isRequired,
  flyToPreviousPoint: PropTypes.func.isRequired,
  markersColor: PropTypes.string,
  onPopupClose: PropTypes.func,
  onPopupOpen: PropTypes.func,
  onRecordEditClick: PropTypes.func.isRequired,
  pointFeature: PropTypes.object.isRequired,
  popupOpen: PropTypes.bool,
  setMarkerByKey: PropTypes.func.isRequired,
}
