import { useCallback, useMemo } from 'react'
import { LayersControl, LayerGroup } from 'react-leaflet'
import type { AnyProps, ClusterFeature, PointFeature } from 'supercluster'

import { ClusterMarker, useFlyToPoint, useLayerRegistration } from '../common'
import { applySortOrder, useMapLayersPanel } from '../MapLayersPanel/MapLayersPanelContext'
import { useSamplingPointDataLayer } from './useSamplingPointDataLayer'
import { SamplingPointDataMarker, type SamplingPointFeature } from './SamplingPointDataMarker'

// supercluster returns the original feature of a sampling point item not clustered
const isSamplingPointFeature = (
  feature: ClusterFeature<AnyProps> | PointFeature<AnyProps>
): feature is SamplingPointFeature => !feature.properties.cluster

type SamplingPointDataLayerProps = {
  levelIndex?: number
  markersColor: any
  createRecordFromSamplingPointDataItem: (...args: any[]) => any
  onRecordEditClick: (...args: any[]) => any
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

  const onMarkerPopupOpen = useCallback((key) => selectPoint(key), [selectPoint])
  const onMarkerPopupClose = useCallback(() => selectPoint(null), [selectPoint])

  useLayerRegistration({ active: isLayerActive, layerKey, layerName: overlayInnerName, points, flyToPoint })

  return (
    <LayersControl.Overlay name={overlayName}>
      <LayerGroup>
        {clusters.map((cluster) => {
          // the point may be either a cluster or a sampling point item
          if (!isSamplingPointFeature(cluster)) {
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
