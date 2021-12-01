import React from 'react'
import { CircleMarker, LayersControl, LayerGroup } from 'react-leaflet'
import PropTypes from 'prop-types'

import { ClusterMarker } from '../common'
import { useSamplingPointDataLayer } from './useSamplingPointDataLayer'
import { SamplingPointDataItemPopup } from './SamplingPointDataItemPopup'

const markerRadius = 10

export const SamplingPointDataLayer = (props) => {
  const { markersColor } = props

  const { checked, clusters, clusterExpansionZoomExtractor, clusterIconCreator, overlayName, totalPoints } =
    useSamplingPointDataLayer(props)

  return (
    <LayersControl.Overlay checked={checked} name={overlayName}>
      <LayerGroup>
        {clusters.map((cluster) => {
          // the point may be either a cluster or a sampling point item
          const { cluster: isCluster, itemUuid, itemCodes, location } = cluster.properties

          // we have a cluster to render
          if (isCluster) {
            return (
              <ClusterMarker
                key={cluster.id}
                cluster={cluster}
                clusterExpansionZoomExtractor={clusterExpansionZoomExtractor}
                clusterIconCreator={clusterIconCreator}
                color={markersColor}
                totalPoints={totalPoints}
              />
            )
          }
          const [longitude, latitude] = cluster.geometry.coordinates

          // we have a single point (sampling point item) to render
          return (
            <CircleMarker key={itemUuid} center={[latitude, longitude]} radius={markerRadius} color={markersColor}>
              <SamplingPointDataItemPopup location={location} codes={itemCodes} />
            </CircleMarker>
          )
        })}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

SamplingPointDataLayer.propTypes = {
  levelIndex: PropTypes.number,
}

SamplingPointDataLayer.defaultProps = {
  levelIndex: 0,
}
