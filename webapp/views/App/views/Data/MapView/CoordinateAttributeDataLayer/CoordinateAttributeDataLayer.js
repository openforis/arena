import React from 'react'
import { LayerGroup, LayersControl } from 'react-leaflet'
import PropTypes from 'prop-types'

import { ClusterMarker, useFlyToPoint } from '../common'
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
                openPopupOfPoint={openPopupOfPoint}
                onRecordEditClick={onRecordEditClick}
                pointLabelFunction={(point) => point.properties.ancestorsKeys.join(' - ')}
                totalPoints={totalPoints}
              />
            )
          }

          // we have a single point (node value) to render
          return (
            <CoordinateAttributeMarker
              key={key}
              attributeDef={attributeDef}
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
          <CoordinateAttributeMarker
            attributeDef={attributeDef}
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

CoordinateAttributeDataLayer.propTypes = {
  attributeDef: PropTypes.any,
  markersColor: PropTypes.any,
  onRecordEditClick: PropTypes.func,
}
