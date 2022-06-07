import React from 'react'
import { CircleMarker, LayersControl, LayerGroup } from 'react-leaflet'
import PropTypes from 'prop-types'

import { ClusterMarker } from '../common'
import { useSamplingPointDataLayer } from './useSamplingPointDataLayer'
import { SamplingPointDataItemPopup } from './SamplingPointDataItemPopup'

const markerRadius = 10

export const SamplingPointDataLayer = (props) => {
  const { markersColor } = props

  const { clusters, clusterExpansionZoomExtractor, clusterIconCreator, overlayName, totalPoints, items } =
    useSamplingPointDataLayer(props)
  const getPointIndex = (uuid) => {
    let index
    items.forEach((p, i) => {
      if (p.uuid == uuid) index = i
      return
    })
    return index
  }

  const getNextPoint = (uuid) => {
    const index = getPointIndex(uuid)
    return items[(index + 1) % items.length]
  }
  const getPreviousPoint = (uuid) => {
    let index = getPointIndex(uuid)
    return items[index > 0 ? index - 1 : items.length - 1]
  }
  return (
    <LayersControl.Overlay name={overlayName}>
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
              <SamplingPointDataItemPopup
                location={location}
                codes={itemCodes}
                itemUuid={itemUuid}
                getNextPoint={getNextPoint}
                getPreviousPoint={getPreviousPoint}
              />
            </CircleMarker>
          )
        })}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

SamplingPointDataLayer.propTypes = {
  levelIndex: PropTypes.number,
  markersColor: PropTypes.any,
}

SamplingPointDataLayer.defaultProps = {
  levelIndex: 0,
}
