import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import PropTypes from 'prop-types'

import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'

const ClusteredPointsPopup = (props) => {
  const { clusteredPoints, openPopupOfPoint } = props

  return (
    <Popup className="cluster-marker__clustered-points-popup">
      <ul>
        {clusteredPoints.map((point) => {
          const { properties } = point
          const { ancestorsKeys, key } = properties
          return (
            <li key={key}>
              <a onClick={() => openPopupOfPoint(point)}>
                <LabelWithTooltip label={ancestorsKeys.join(' - ')} />
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
}

export const ClusterMarker = (props) => {
  const {
    cluster,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    color,
    getClusterLeaves,
    openPopupOfPoint,
    totalPoints,
  } = props

  const map = useMap()

  const { properties, id } = cluster
  const { point_count: pointCount } = properties

  const position = useMemo(() => {
    const [longitude, latitude] = cluster.geometry.coordinates
    return [latitude, longitude]
  }, [cluster])

  const markerRef = useRef(null)
  const [clusteredPoints, setClusteredPoints] = useState([])

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
      <ClusteredPointsPopup clusteredPoints={clusteredPoints} openPopupOfPoint={openPopupOfPoint} />
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
  totalPoints: PropTypes.number.isRequired,
}
