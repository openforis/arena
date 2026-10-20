import { useCallback, useMemo } from 'react'
import { LayerGroup, LayersControl } from 'react-leaflet'
import PropTypes from 'prop-types'

import * as NodeDef from '@core/survey/nodeDef'
import { ClusterMarker, useFlyToPoint, useLayerRegistration } from '../common'
import { CoordinateAttributeMarker } from './CoordinateAttributeMarker'
import { useGeoAttributeDataLayer } from './useGeoAttributeDataLayer'
import { applySortOrder, useMapLayersPanel } from '../MapLayersPanel/MapLayersPanelContext'

export const GeoAttributeDataLayer = (props) => {
  const {
    attributeDef,
    checked = false,
    markersColor,
    onPointsLoaded = null,
    onRecordEditClick,
    pointsFilter = null,
    renderPopup = null,
  } = props

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
  } = useGeoAttributeDataLayer({
    attributeDef,
    checked,
    markersColor,
    onPointsLoaded,
    pointsFilter,
  })

  const layerKey = NodeDef.getUuid(attributeDef)
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
  } = useFlyToPoint({ points: sortedPoints, onRecordEditClick, zoomToMaxLevel: NodeDef.isCoordinate(attributeDef) })

  const onMarkerPopupOpen = useCallback((key) => selectPoint(key), [selectPoint])
  const onMarkerPopupClose = useCallback(() => selectPoint(null), [selectPoint])

  useLayerRegistration({ layerKey, layerName: layerInnerName, points, flyToPoint })

  return (
    <LayersControl.Overlay name={layerName} checked={checked}>
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
              renderPopup={renderPopup}
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
            renderPopup={renderPopup}
            setMarkerByKey={setMarkerByKey}
          />
        )}
      </LayerGroup>
    </LayersControl.Overlay>
  )
}

GeoAttributeDataLayer.propTypes = {
  attributeDef: PropTypes.any,
  checked: PropTypes.bool, // when true, the layer is selected (and its data fetched) on mount
  markersColor: PropTypes.any,
  onPointsLoaded: PropTypes.func, // called with ({ layerKey, points }) on every data fetch, before filtering
  onRecordEditClick: PropTypes.func,
  pointsFilter: PropTypes.func, // when specified, only the matching points are shown
  renderPopup: PropTypes.func, // when specified, replaces the default marker popup
}
