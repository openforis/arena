import React, { useCallback, useRef, useState } from 'react'
import { LayerGroup, LayersControl } from 'react-leaflet'
import PropTypes from 'prop-types'

import { ClusterMarker } from '../common'
import { CoordinateAttributeMarker } from './CoordinateAttributeMarker'
import { useCoordinateAttributeDataLayer } from './useCoordinateAttributeDataLayer'

export const CoordinateAttributeDataLayer = (props) => {
  const { attributeDef, markersColor, onRecordEditClick } = props

  const {
    layerName,
    clusters,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    getClusterLeaves,
    totalPoints,
    points,
  } = useCoordinateAttributeDataLayer(props)

  const [currentPointShown, setCurrentPointShown] = useState(null)

  // Have a Reference to points for opening popups automatically
  const markerRefs = useRef([])

  const setMarkerByParentUuid = useCallback(({ parentUuid, marker }) => {
    markerRefs.current[parentUuid] = marker
  }, [])

  const openPopupOfPoint = useCallback(
    async (point) => {
      const marker = markerRefs.current[point.uuid]
      if (marker) {
        marker.openPopup()
      } else {
        if (currentPointShown) {
          // unmount current marker
          await setCurrentPointShown(null)
        }
        // marker is not visible (it's clustered); add it to the map as CoordinateAttributeMarker
        setCurrentPointShown(point)
      }
    },
    [currentPointShown]
  )

  const getPointIndex = (uuid) => points.findIndex((item) => item.properties.parentUuid === uuid)

  const getNextPoint = (uuid) => {
    const index = getPointIndex(uuid)
    return points[(index + 1) % points.length]
  }

  const getPreviousPoint = (uuid) => {
    let index = getPointIndex(uuid)
    return points[index > 0 ? index - 1 : points.length - 1]
  }

  return (
    <LayersControl.Overlay name={layerName}>
      <LayerGroup>
        {clusters.map((cluster) => {
          // the point may be either a cluster or a node value point
          const { cluster: isCluster, key } = cluster.properties

          // we have a cluster to render
          if (isCluster) {
            return (
              <ClusterMarker
                key={cluster.id}
                cluster={cluster}
                color={markersColor}
                clusterExpansionZoomExtractor={clusterExpansionZoomExtractor}
                clusterIconCreator={clusterIconCreator}
                getClusterLeaves={getClusterLeaves}
                onRecordEditClick={onRecordEditClick}
                openPopupOfPoint={openPopupOfPoint}
                totalPoints={totalPoints}
              />
            )
          }

          // we have a single point (node value) to render
          return (
            <CoordinateAttributeMarker
              key={key}
              attributeDef={attributeDef}
              markersColor={markersColor}
              pointFeature={cluster}
              onRecordEditClick={onRecordEditClick}
              getNextPoint={getNextPoint}
              getPreviousPoint={getPreviousPoint}
              openPopupOfPoint={openPopupOfPoint}
              setMarkerByParentUuid={setMarkerByParentUuid}
            />
          )
        })}
        {currentPointShown && (
          <CoordinateAttributeMarker
            attributeDef={attributeDef}
            markersColor={markersColor}
            pointFeature={currentPointShown}
            onRecordEditClick={onRecordEditClick}
            getNextPoint={getNextPoint}
            getPreviousPoint={getPreviousPoint}
            openPopupOfPoint={openPopupOfPoint}
            popupOpen={true}
          />
        )}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

CoordinateAttributeDataLayer.propTypes = {
  attributeDef: PropTypes.any,
  markersColor: PropTypes.any,
  onRecordEditClick: PropTypes.func,
}
