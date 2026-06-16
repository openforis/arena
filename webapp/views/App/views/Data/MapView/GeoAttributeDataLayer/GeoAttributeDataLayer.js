import { useCallback, useEffect, useMemo, useRef } from 'react'
import { LayerGroup, LayersControl } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import { ClusterMarker, useFlyToPoint } from '../common'
import { CoordinateAttributeMarker } from './CoordinateAttributeMarker'
import { useGeoAttributeDataLayer } from './useGeoAttributeDataLayer'
import { applySortOrder, useMapLayersPanel } from '../MapLayersPanel/MapLayersPanelContext'

export const GeoAttributeDataLayer = (props) => {
  const { attributeDef, onRecordEditClick } = props

  const {
    layerName,
    layerInnerName,
    currentMarkersColor,
    clusters,
    clusterExpansionZoomExtractor,
    clusterIconCreator,
    getClusterLeaves,
    totalPoints,
    points,
  } = useGeoAttributeDataLayer(props)

  const { registerLayer, unregisterLayer, selectPoint, layerSortOrders } = useMapLayersPanel()
  const layerKey = NodeDef.getUuid(attributeDef)
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
  } = useFlyToPoint({ points: sortedPoints, onRecordEditClick, zoomToMaxLevel: NodeDef.isCoordinate(attributeDef) })

  const onMarkerPopupOpen = useCallback((key) => selectPoint(key), [selectPoint])
  const onMarkerPopupClose = useCallback(() => selectPoint(null), [selectPoint])

  // Stable wrapper so the panel always calls the latest flyToPoint without re-registering on popup state changes
  const flyToPointRef = useRef(flyToPoint)
  useEffect(() => {
    flyToPointRef.current = flyToPoint
  }, [flyToPoint])
  const stableFlyToPoint = useCallback((point) => flyToPointRef.current(point), [])

  useEffect(() => {
    if (points.length === 0) {
      unregisterLayer({ key: layerKey })
      return
    }
    registerLayer({ key: layerKey, layerName: layerInnerName, points, flyToPoint: stableFlyToPoint })
  }, [layerKey, layerInnerName, points, registerLayer, stableFlyToPoint, unregisterLayer])

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
                color={currentMarkersColor}
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
              data={cluster}
              flyToPoint={flyToPoint}
              flyToNextPoint={flyToNextPoint}
              flyToPreviousPoint={flyToPreviousPoint}
              markersColor={currentMarkersColor}
              onPopupClose={onMarkerPopupClose}
              onPopupOpen={onMarkerPopupOpen}
              onRecordEditClick={onRecordEditClick}
              setMarkerByKey={setMarkerByKey}
            />
          )
        })}
        {currentPointShown && (
          <CoordinateAttributeMarker
            attributeDef={attributeDef}
            data={currentPointShown}
            flyToNextPoint={flyToNextPoint}
            flyToPreviousPoint={flyToPreviousPoint}
            markersColor={currentMarkersColor}
            onPopupClose={() => {
              onCurrentPointPopupClose()
              onMarkerPopupClose()
            }}
            onPopupOpen={onMarkerPopupOpen}
            onRecordEditClick={onRecordEditClick}
            popupOpen={currentPointPopupOpen}
            setMarkerByKey={setMarkerByKey}
          />
        )}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

GeoAttributeDataLayer.propTypes = {
  attributeDef: PropTypes.any,
  markersColor: PropTypes.any,
  onRecordEditClick: PropTypes.func,
}
