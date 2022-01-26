import React from 'react'
import { LayerGroup, LayersControl } from 'react-leaflet'

import { ClusterMarker } from '../common'
import { CoordinateAttributeMarker } from './CoordinateAttributeMarker'
import { useCoordinateAttributeDataLayer } from './useCoordinateAttributeDataLayer'

export const CoordinateAttributeDataLayer = (props) => {
  const { attributeDef, markersColor, onRecordEditClick } = props

  const { layerName, clusters, clusterExpansionZoomExtractor, clusterIconCreator, totalPoints } =
    useCoordinateAttributeDataLayer(props)

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
            />
          )
        })}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}
