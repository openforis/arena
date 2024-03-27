import React from 'react'
import PropTypes from 'prop-types'
import { LayerGroup, LayersControl } from 'react-leaflet'

import { ClusterMarker, useFlyToPoint } from '../common'

import { SamplingPointDataMarker } from './SamplingPointDataMarker'
import { useSamplingPointDataLayer } from './useSamplingPointDataLayer'

export const SamplingPointDataLayer = (props) => {
  const { markersColor, onRecordEditClick, createRecordFromSamplingPointDataItem } = props

  const {
    clusters,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    getClusterLeaves,
    overlayName,
    totalPoints,
    points,
  } = useSamplingPointDataLayer(props)

  const {
    currentPointShown,
    currentPointPopupOpen,
    flyToPoint,
    flyToNextPoint,
    flyToPreviousPoint,
    onCurrentPointPopupClose,
    openPopupOfPoint,
    setMarkerByKey,
  } = useFlyToPoint({ points, onRecordEditClick })

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
              flyToPoint={flyToPoint}
              flyToNextPoint={flyToNextPoint}
              flyToPreviousPoint={flyToPreviousPoint}
              markersColor={markersColor}
              onRecordEditClick={onRecordEditClick}
              pointFeature={cluster}
              setMarkerByKey={setMarkerByKey}
            />
          )
        })}
        {currentPointShown && (
          <SamplingPointDataMarker
            createRecordFromSamplingPointDataItem={createRecordFromSamplingPointDataItem}
            flyToPoint={flyToPoint}
            flyToNextPoint={flyToNextPoint}
            flyToPreviousPoint={flyToPreviousPoint}
            markersColor={markersColor}
            onPopupClose={onCurrentPointPopupClose}
            onRecordEditClick={onRecordEditClick}
            pointFeature={currentPointShown}
            popupOpen={currentPointPopupOpen}
            setMarkerByKey={setMarkerByKey}
          />
        )}
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
