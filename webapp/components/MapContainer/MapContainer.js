import './Map.scss'

import { useEffect } from 'react'
import { GeoJSON, MapContainer as RLMapContainer, ZoomControl, useMap as useLeafletMap } from 'react-leaflet'
import PropTypes from 'prop-types'

import { ButtonSave } from '@webapp/components'

import i18nInstance from '@core/i18n/i18nFactory'

import { MapLayersControl } from './MapLayersControl'
import { MapMarker } from './MapMarker'
import { MapContextProvider } from './MapContext'
import { useMap } from './useMap'

import { UtmGrid } from './UtmGrid'
import { INITIAL_ZOOM_LEVEL, MAP_MAX_ZOOM, MAP_MIN_ZOOM } from './mapZoom'
import { MapInstanceBridge, MapWorkspaceProvider } from './workspace/MapWorkspaceContext'
import { MapWorkspace } from './workspace/MapWorkspace'
import { MapCustomOverlaysProvider } from './workspace/layers/MapCustomOverlaysContext'
import { useMapRailTabs } from './workspace/rail/useMapRailTabs'

// start of workaround to show leaflet marker icon
import L from 'leaflet'
L.Marker.prototype.options.icon = L.icon({
  iconSize: [25, 41],
  iconAnchor: [10, 41],
  popupAnchor: [2, -40],
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
})
// end of workaround

// Explicit, unconditional map-level maxZoom keeps map.getMaxZoom() finite and stable
// regardless of which base layer is active. Without it, Leaflet derives the max
// dynamically from whichever GridLayer-based TileLayers are currently registered - but
// the Equal Earth base layer isn't a GridLayer and registers no zoom bound at all, so
// with it active the derived max becomes Infinity, which broke useFlyToPoint's
// map.flyTo(latlng, Infinity) (NaN propagates through Leaflet's flyTo animation math
// and throws) and made ClusterMarker's "already at max zoom" check permanently false.
// 17 matches the highest maxZoom among the existing raster layers (ESRI World
// Imagery); layers with a lower native maxZoom (e.g. ESRI Terrain's 9) still stop
// fetching new tiles at their own maxZoom and show stretched tiles beyond it - same as
// normal over-zoom behavior, this doesn't change what tiles are available.
const MAP_MAX_BOUNDS = [
  [180, -Infinity],
  [-180, Infinity],
]

const MapResizeHandler = () => {
  const map = useLeafletMap()

  useEffect(() => {
    const container = map.getContainer()
    let rafId
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => map.invalidateSize())
    })
    observer.observe(container)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [map])

  return null
}

export const MapContainer = (props) => {
  const {
    baseLayersLabel,
    centerPoint,
    editable = false,
    extraRailTabs,
    geoJson = null,
    layers = [],
    markerPoint,
    markerTitle,
    onMarkerPointChange,
    overlayGroups,
    records,
    variant = 'compact',
  } = props
  const { centerPositionLatLon, markerPointUpdated, markerPointUpdatedToString, onMarkerPointUpdated, onSaveClick } =
    useMap({ centerPoint, geoJson, markerPoint, onMarkerPointChange })
  // before the early return: hooks run on every render
  const railTabs = useMapRailTabs({ variant, extraRailTabs, dataLayersCount: layers.length })

  if (!centerPositionLatLon) {
    return null
  }

  const markerPointUpdatedValid =
    markerPointUpdated && Number.isFinite(markerPointUpdated.x) && Number.isFinite(markerPointUpdated.y)

  const markerUpdatedText = markerPointUpdatedValid
    ? markerPointUpdatedToString
    : i18nInstance.t('mapView.locationNotValidOrOutOfRange')

  const mapElement = (
    <RLMapContainer
      center={centerPositionLatLon}
      doubleClickZoom={false}
      zoomControl={false}
      zoom={INITIAL_ZOOM_LEVEL}
      minZoom={MAP_MIN_ZOOM}
      maxZoom={MAP_MAX_ZOOM}
      maxBounds={MAP_MAX_BOUNDS}
      maxBoundsViscosity={1}
    >
      <MapInstanceBridge />
      <MapResizeHandler />
      <MapLayersControl layers={layers} baseLayersLabel={baseLayersLabel} overlayGroups={overlayGroups} />
      <MapMarker editable={editable} point={markerPoint} onPointUpdated={onMarkerPointUpdated} title={markerTitle} />
      {geoJson && <GeoJSON data={geoJson} />}
      <UtmGrid />
      <ZoomControl position="bottomright" />
    </RLMapContainer>
  )

  return (
    <div className={`map-wrapper map-wrapper--${variant}${editable ? ' editable' : ''}`}>
      <MapContextProvider>
        <MapWorkspaceProvider variant={variant}>
          <MapCustomOverlaysProvider>
            <MapWorkspace
              hint={editable ? i18nInstance.t('mapView.locationEditInfo') : null}
              railTabs={railTabs}
              records={records}
              mapElement={mapElement}
            />
          </MapCustomOverlaysProvider>
        </MapWorkspaceProvider>
      </MapContextProvider>

      {editable && (
        <div className="button-bar">
          {markerPointUpdated && (
            <div className="location-updated-label">
              <label>
                {i18nInstance.t('mapView.locationUpdated')}:<span>{markerUpdatedText}</span>
              </label>
            </div>
          )}
          <ButtonSave disabled={!markerPointUpdated || !markerPointUpdatedValid} onClick={onSaveClick} />
        </div>
      )}
    </div>
  )
}

MapContainer.propTypes = {
  baseLayersLabel: PropTypes.string,
  centerPoint: PropTypes.object,
  editable: PropTypes.bool,
  extraRailTabs: PropTypes.array,
  geoJson: PropTypes.object,
  layers: PropTypes.array,
  markerPoint: PropTypes.object,
  markerTitle: PropTypes.string,
  onMarkerPointChange: PropTypes.func,
  overlayGroups: PropTypes.array,
  records: PropTypes.shape({ candidates: PropTypes.array.isRequired, onSelect: PropTypes.func.isRequired }),
  variant: PropTypes.oneOf(['full', 'compact']),
}
