import React, { useRef } from 'react'
import { LayersControl, LayerGroup } from 'react-leaflet'
import PropTypes from 'prop-types'

import { ClusterMarker } from '../common'
import { useSamplingPointDataLayer } from './useSamplingPointDataLayer'
import { SamplingPointDataMarker } from './SamplingPointDataMarker'

export const SamplingPointDataLayer = (props) => {
  const { markersColor, onRecordEditClick, createRecordFromSamplingPointDataItem } = props

  const {
    clusters,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    getClusterLeaves,
    overlayName,
    totalPoints,
    items,
  } = useSamplingPointDataLayer(props)

  // Have a Reference to points for opening popups automatically
  const markerRefs = useRef([])

  const openPopupOfPoint = (point) => {
    const marker = markerRefs.current[point.uuid]
    marker?.openPopup()
  }

  const getPointIndex = (uuid) => {
    return items.findIndex((item) => item.uuid === uuid)
  }

  const getNextPoint = (uuid) => {
    const index = getPointIndex(uuid)
    return items[(index + 1) % items.length]
  }

  const getPreviousPoint = (uuid) => {
    const index = getPointIndex(uuid)
    return items[index > 0 ? index - 1 : items.length - 1]
  }

  return (
    <LayersControl.Overlay name={overlayName}>
      <LayerGroup>
        {clusters.map((cluster) => {
          // the point may be either a cluster or a sampling point item
          const { cluster: isCluster, itemUuid } = cluster.properties

          // we have a cluster to render
          if (isCluster) {
            return (
              <ClusterMarker
                key={cluster.id}
                cluster={cluster}
                clusterExpansionZoomExtractor={clusterExpansionZoomExtractor}
                clusterIconCreator={clusterIconCreator}
                color={markersColor}
                getClusterLeaves={getClusterLeaves}
                openPopupOfPoint={openPopupOfPoint}
                pointLabelFunction={(point) => point.properties.itemCodes.join(' - ')}
                totalPoints={totalPoints}
              />
            )
          }
          // we have a single point (sampling point item) to render
          return (
            <SamplingPointDataMarker
              key={itemUuid}
              createRecordFromSamplingPointDataItem={createRecordFromSamplingPointDataItem}
              getNextPoint={getNextPoint}
              getPreviousPoint={getPreviousPoint}
              markersColor={markersColor}
              markerRefs={markerRefs}
              openPopupOfPoint={openPopupOfPoint}
              onRecordEditClick={onRecordEditClick}
              pointFeature={cluster}
            />
          )
        })}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

SamplingPointDataLayer.propTypes = {
  levelIndex: PropTypes.number,
  markersColor: PropTypes.any.isRequired,
  createRecordFromSamplingPointDataItem: PropTypes.func.isRequired,
  onRecordEditClick: PropTypes.func.isRequired,
}

SamplingPointDataLayer.defaultProps = {
  levelIndex: 0,
}
