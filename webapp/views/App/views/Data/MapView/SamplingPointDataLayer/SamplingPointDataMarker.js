import React, { useEffect, useRef } from 'react'
import { CircleMarker } from 'react-leaflet'
import PropTypes from 'prop-types'

import { useMapContextOptions } from '@webapp/components/Map/MapContext'

import { MarkerTooltip } from '../common/MarkerTooltip'
import { SamplingPointDataItemPopup } from './SamplingPointDataItemPopup'

const markerRadius = 10

export const SamplingPointDataMarker = (props) => {
  const {
    createRecordFromSamplingPointDataItem,
    getNextPoint,
    getPreviousPoint,
    markersColor,
    markerRefs,
    openPopupOfPoint,
    onRecordEditClick,
    pointFeature,
  } = props
  const { geometry, properties } = pointFeature
  const { itemUuid, itemCodes } = properties
  const [longitude, latitude] = geometry.coordinates

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
  }, [circleRef, showLocationMarkers, showMarkersLabels])

  return (
    <CircleMarker
      center={[latitude, longitude]}
      radius={markerRadius}
      color={markersColor}
      ref={(ref) => {
        circleRef.current = ref
        if (ref != null) markerRefs.current[itemUuid] = ref
      }}
    >
      {showMarkersLabels && <MarkerTooltip color={markersColor}>{itemCodes.join(' - ')}</MarkerTooltip>}

      <SamplingPointDataItemPopup
        pointFeature={pointFeature}
        getNextPoint={getNextPoint}
        getPreviousPoint={getPreviousPoint}
        openPopupOfPoint={openPopupOfPoint}
        onRecordEditClick={onRecordEditClick}
        createRecordFromSamplingPointDataItem={createRecordFromSamplingPointDataItem}
      />
    </CircleMarker>
  )
}

SamplingPointDataMarker.propTypes = {
  createRecordFromSamplingPointDataItem: PropTypes.func.isRequired,
  getNextPoint: PropTypes.func.isRequired,
  getPreviousPoint: PropTypes.func.isRequired,
  markersColor: PropTypes.string,
  markerRefs: PropTypes.object.isRequired,
  openPopupOfPoint: PropTypes.func.isRequired,
  onRecordEditClick: PropTypes.func.isRequired,
  pointFeature: PropTypes.object.isRequired,
}
