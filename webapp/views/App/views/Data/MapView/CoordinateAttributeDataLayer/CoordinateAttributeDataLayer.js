import React from 'react'
import { CircleMarker, LayerGroup, LayersControl } from 'react-leaflet'

import { ClusterMarker } from '../common'
import { CoordinateAttributePopUp } from './CoordinateAttributePopUp'
import { useCoordinateAttributeDataLayer } from './useCoordinateAttributeDataLayer'

const markerRadius = 10

export const CoordinateAttributeDataLayer = (props) => {
  const { attributeDef, markersColor, onRecordEditClick } = props

  const { layerName, clusters, clusterExpansionZoomExtractor, clusterIconCreator, totalPoints } =
    useCoordinateAttributeDataLayer(props)

  return (
    <LayersControl.Overlay name={layerName}>
      <LayerGroup>
        {clusters.map((cluster) => {
          // the point may be either a cluster or a node value point
          const { cluster: isCluster, key, recordUuid, parentUuid, point } = cluster.properties

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
            <CircleMarker
              key={key}
              center={[latitude, longitude]}
              radius={markerRadius}
              color={markersColor}
              fillColor={markersColor}
              fillOpacity={0.5}
            >
              <CoordinateAttributePopUp
                attributeDef={attributeDef}
                point={point}
                recordUuid={recordUuid}
                parentUuid={parentUuid}
                onRecordEditClick={onRecordEditClick}
              />
            </CircleMarker>
          )
        })}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}
