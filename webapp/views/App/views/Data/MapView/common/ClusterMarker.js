import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Marker, Popup, useMap } from 'react-leaflet'

import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import { useMapContextOptions } from '@webapp/components/Map/MapContext'

const ClusteredPointsPopup = (props) => {
  const { clusteredPoints, openPopupOfPoint, pointLabelFunction } = props

  return (
    <Popup className="cluster-marker__clustered-points-popup">
      <ul>
        {clusteredPoints.map((point) => {
          const { properties } = point
          const { key } = properties
          return (
            <li key={key}>
              <a onClick={() => openPopupOfPoint(point)}>
                <LabelWithTooltip label={pointLabelFunction(point)} />
              </a>
            </li>
          )
        })}
      </ul>
    </Popup>
  )
}

ClusteredPointsPopup.propTypes = {
  clusteredPoints: PropTypes.array.isRequired,
  openPopupOfPoint: PropTypes.func.isRequired,
  pointLabelFunction: PropTypes.func.isRequired,
}

export const ClusterMarker = (props) => {
  const {
    cluster,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    color,
    getClusterLeaves,
    openPopupOfPoint,
    pointLabelFunction,
    totalPoints,
  } = props

  const map = useMap()

  const { geometry, id, properties } = cluster
  const { point_count: pointCount } = properties
  const [longitude, latitude] = geometry.coordinates

  const position = useMemo(() => [latitude, longitude], [latitude, longitude])

  const markerRef = useRef(null)
  const [clusteredPoints, setClusteredPoints] = useState([])

  const options = useMapContextOptions()
  const { showLocationMarkers } = options

  // hide cluster marker if showLocationMarkers is false
  useEffect(() => {
    const marker = markerRef.current
    marker.setOpacity(showLocationMarkers ? 1 : 0)
  }, [markerRef, showLocationMarkers])

  const onClick = useCallback(() => {
    const maxZoom = map.getMaxZoom()

    if (map.getZoom() === maxZoom) {
      // prepare popup content
      const leaves = getClusterLeaves(cluster)
      setClusteredPoints(leaves)
    } else {
      markerRef.current.closePopup()

      const expansionZoom = Math.min(clusterExpansionZoomExtractor(cluster), maxZoom)
      map.setView(position, expansionZoom, {
        animate: true,
      })
    }
  }, [cluster, clusterExpansionZoomExtractor, getClusterLeaves, map, position])

  const size = 10 + (pointCount / totalPoints) * 40

  return (
    <Marker
      key={`cluster-${id}`}
      position={position}
      icon={clusterIconCreator({ count: pointCount, size, color })}
      eventHandlers={{ click: onClick }}
      ref={markerRef}
    >
      <ClusteredPointsPopup
        clusteredPoints={clusteredPoints}
        openPopupOfPoint={openPopupOfPoint}
        pointLabelFunction={pointLabelFunction}
      />
    </Marker>
  )
}

ClusterMarker.propTypes = {
  cluster: PropTypes.object.isRequired,
  clusterExpansionZoomExtractor: PropTypes.func.isRequired,
  clusterIconCreator: PropTypes.func.isRequired,
  color: PropTypes.string.isRequired,
  getClusterLeaves: PropTypes.func.isRequired,
  openPopupOfPoint: PropTypes.func.isRequired,
  pointLabelFunction: PropTypes.func.isRequired,
  totalPoints: PropTypes.number.isRequired,
}
