import React, { useCallback, useRef } from 'react'
import { LayerGroup, LayersControl } from 'react-leaflet'
import PropTypes from 'prop-types'

import { ClusterMarker } from '../common'
import { CoordinateAttributeMarker } from './CoordinateAttributeMarker'
import { useCoordinateAttributeDataLayer } from './useCoordinateAttributeDataLayer'

export const CoordinateAttributeDataLayer = (props) => {
  const { attributeDef, markersColor, onRecordEditClick } = props

  const { layerName, clusters, clusterExpansionZoomExtractor, clusterIconCreator, totalPoints, points } =
    useCoordinateAttributeDataLayer(props)

  // Have a Reference to points for opening popups automatically
  let markerRefs = useRef([])
  const openPopupOfUuid = (uuid) => {
    markerRefs.current[uuid].openPopup()
  }

  const getPointIndex = (uuid) => {
    return points.findIndex((item) => {
      return item.properties.parentUuid === uuid})
  }

  const getNextPoint = (uuid) => {
    const index = getPointIndex(uuid)
    return points[(index + 1) % points.length]
  }
  const getPreviousPoint = (uuid) => {
    let index = getPointIndex(uuid)
    return points[index > 0 ? index - 1 : points.length - 1]
  }

  const setRef = useCallback( (parentUuid, ref) => {
    if (ref != null) markerRefs.current[parentUuid] = ref.current
  }, [clusters])
  return (
    <LayersControl.Overlay name={layerName}>
      <LayerGroup>
        {clusters.map((cluster) => {
          // the point may be either a cluster or a node value point
          const { cluster: isCluster, key, recordUuid, parentUuid, point, ancestorsKeys } = cluster.properties

          // we have a cluster to render
          if (isCluster) {
            return (
              <ClusterMarker
                key={cluster.id}
                cluster={cluster}
                color={markersColor}
                clusterExpansionZoomExtractor={clusterExpansionZoomExtractor}
                clusterIconCreator={clusterIconCreator}
                totalPoints={totalPoints}
              />
            )
          }
          const [longitude, latitude] = cluster.geometry.coordinates

          // we have a single point (node value) to render
          return (
            <CoordinateAttributeMarker
              key={key}
              ancestorsKeys={ancestorsKeys}
              attributeDef={attributeDef}
              latitude={latitude}
              longitude={longitude}
              markersColor={markersColor}
              parentUuid={parentUuid}
              point={point}
              onRecordEditClick={onRecordEditClick}
              recordUuid={recordUuid}
              getNextPoint={getNextPoint}
              getPreviousPoint={getPreviousPoint}
              openPopupOfUuid={openPopupOfUuid}
              setRef={setRef}
            />
          )
        })}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

CoordinateAttributeDataLayer.propTypes = {
  attributeDef: PropTypes.any,
  markersColor: PropTypes.any,
  onRecordEditClick: PropTypes.func
}