import React from 'react'
import { CircleMarker, LayerGroup, LayersControl, Tooltip } from 'react-leaflet'

import { ClusterMarker } from '../common'
import { CoordinateAttributePopUp } from './CoordinateAttributePopUp'
import { useCoordinateAttributeDataLayer } from './useCoordinateAttributeDataLayer'

const markerRadius = 10

export const CoordinateAttributeDataLayer = (props) => {
  const { attributeDef, markersColor, showMarkerKeys, onRecordEditClick } = props

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
            <CircleMarker
              key={key}
              center={[latitude, longitude]}
              radius={markerRadius}
              color={markersColor}
              fillColor={markersColor}
              fillOpacity={0.5}
            >
              {showMarkerKeys && (
                <Tooltip direction="top" offset={[0, -10]} opacity={0.7} permanent>
                  {ancestorsKeys.join(' - ')}
                </Tooltip>
              )}
              <CoordinateAttributePopUp
                attributeDef={attributeDef}
                point={point}
                recordUuid={recordUuid}
                parentUuid={parentUuid}
                ancestorsKeys={ancestorsKeys}
                onRecordEditClick={onRecordEditClick}
              />
            </CircleMarker>
          )
        })}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}
