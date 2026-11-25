import { useCallback, useMemo } from 'react'
import { LayerGroup, LayersControl } from 'react-leaflet'

import { ClusterMarker, useFlyToPoint, useLayerRegistration } from '../common'
import {
  type CreateRecordFromSamplingPointDataItem,
  isMapClusterFeature,
  type RecordEditClickHandler,
} from '../common/mapPointTypes'
import { applySortOrder, useMapLayersPanel } from '../MapLayersPanel/MapLayersPanelContext'

import { SamplingPointDataMarker } from './SamplingPointDataMarker'
import { useSamplingPointDataLayer } from './useSamplingPointDataLayer'

type SamplingPointDataLayerProps = {
  levelIndex?: number
  markersColor: string
  createRecordFromSamplingPointDataItem: CreateRecordFromSamplingPointDataItem
  onRecordEditClick: RecordEditClickHandler
}

export const SamplingPointDataLayer = (props: SamplingPointDataLayerProps) => {
  const { levelIndex = 0, markersColor, onRecordEditClick, createRecordFromSamplingPointDataItem } = props

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
  } = useSamplingPointDataLayer({ levelIndex, markersColor })

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

  const onMarkerPopupOpen = useCallback((key: string) => selectPoint(key), [selectPoint])
  const onMarkerPopupClose = useCallback(() => selectPoint(null), [selectPoint])

  useLayerRegistration({ active: isLayerActive, layerKey, layerName: overlayInnerName, points, flyToPoint })

  return (
    <LayersControl.Overlay name={overlayName}>
      <LayerGroup>
        {clusters.map((cluster) => {
          // the point may be either a cluster or a sampling point item
          if (isMapClusterFeature(cluster)) {
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
              key={cluster.properties.itemUuid}
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
