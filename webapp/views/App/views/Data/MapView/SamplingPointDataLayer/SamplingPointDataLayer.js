import { useCallback, useMemo } from 'react'
import { LayersControl, LayerGroup } from 'react-leaflet'
import PropTypes from 'prop-types'

import { ClusterMarker, useFlyToPoint, useLayerRegistration } from '../common'
import { applySortOrder, useMapLayersPanel } from '../MapLayersPanel/MapLayersPanelContext'
import { useSamplingPointDataLayer } from './useSamplingPointDataLayer'
import { SamplingPointDataMarker } from './SamplingPointDataMarker'

export const SamplingPointDataLayer = (props) => {
  const { levelIndex = 0, onRecordEditClick, createRecordFromSamplingPointDataItem } = props

  const {
    clusters,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    getClusterLeaves,
    isLayerActive,
    overlayInnerName,
    overlayName,
    currentMarkersColor,
    totalPoints,
    points,
  } = useSamplingPointDataLayer(props)

  const layerKey = `sampling-point-data-${levelIndex}`
  const { selectPoint, layerSortOrders } = useMapLayersPanel()
  const sortOrder = layerSortOrders[layerKey] ?? 'none'
  const sortedPoints = useMemo(() => applySortOrder(points, sortOrder), [points, sortOrder])

  const {
    currentPointShown,
    currentPointPopupOpen,
    flyToPoint,
    flyToNextPoint,
    flyToPreviousPoint,
    onCurrentPointPopupClose,
    openPopupOfPoint,
    setMarkerByKey,
  } = useFlyToPoint({ points: sortedPoints, onRecordEditClick })

  const onMarkerPopupOpen = useCallback((key) => selectPoint(key), [selectPoint])
  const onMarkerPopupClose = useCallback(() => selectPoint(null), [selectPoint])

  useLayerRegistration({ active: isLayerActive, layerKey, layerName: overlayInnerName, points, flyToPoint })

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
                color={currentMarkersColor}
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
              markersColor={currentMarkersColor}
              onPopupClose={onMarkerPopupClose}
              onPopupOpen={onMarkerPopupOpen}
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
            markersColor={currentMarkersColor}
            onPopupClose={() => {
              onCurrentPointPopupClose()
              onMarkerPopupClose()
            }}
            onPopupOpen={onMarkerPopupOpen}
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
