import './Map.scss'

import { useEffect } from 'react'
import {
  GeoJSON,
  MapContainer as RLMapContainer,
  ScaleControl,
  ZoomControl,
  useMap as useLeafletMap,
} from 'react-leaflet'
import Ruler from 'react-leaflet-ruler'
import PropTypes from 'prop-types'

import { ButtonSave } from '@webapp/components'

import i18nInstance from '@core/i18n/i18nFactory'

import { MapLayersControl } from './MapLayersControl'
import { MapMarker } from './MapMarker'
import { MapOptionsEditor } from './MapOptionsEditor'
import { MapContextProvider } from './MapContext'
import { useMap } from './useMap'

import { MapBaseLayerPeriodSelector } from './MapBaseLayerPeriodSelector'
import { KmlUploader } from './KmlUploader'
import { ZoomLevel } from './ZoomLevel'
import { UtmGrid } from './UtmGrid'

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

const INITIAL_ZOOM_LEVEL = 3
// 2, not 3, so a user can manually zoom out one step from the default view (still
// INITIAL_ZOOM_LEVEL = 3) without hitting the floor immediately. Accepted trade-off:
// raster base layers below this hardcode minZoom={3} on their own TileLayer (see
// MapLayersControl.js), so zooming one of them out to exactly level 2 shows a blank
// map at that level - recoverable by zooming back in or switching layers. Narrower
// than the regression this constant was raised from (was 1, affecting two zoom levels
// for every raster layer); deliberately kept at 2 rather than reverting further.
const MAP_MIN_ZOOM = 2
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
const MAP_MAX_ZOOM = 17
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
    editable = false,
    equalEarthAsDefault = false,
    geoJson = null,
    layers = [],
    markerPoint,
    markerTitle,
    overlayGroups,
    showOptions = true,
  } = props
  const { centerPositionLatLon, markerPointUpdated, markerPointUpdatedToString, onMarkerPointUpdated, onSaveClick } =
    useMap(props)

  if (!centerPositionLatLon) {
    return null
  }

  const markerPointUpdatedValid =
    markerPointUpdated && Number.isFinite(markerPointUpdated.x) && Number.isFinite(markerPointUpdated.y)

  const markerUpdatedText = markerPointUpdatedValid
    ? markerPointUpdatedToString
    : i18nInstance.t('mapView.locationNotValidOrOutOfRange')

  return (
    <div className={`map-wrapper${editable ? ' editable' : ''}`}>
      {editable && <div className="location-edit-info">{i18nInstance.t('mapView.locationEditInfo')}</div>}

      <MapContextProvider>
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
          <MapResizeHandler />
          <MapLayersControl
            layers={layers}
            baseLayersLabel={baseLayersLabel}
            overlayGroups={overlayGroups}
            equalEarthAsDefault={equalEarthAsDefault}
          />
          <MapMarker
            editable={editable}
            point={markerPoint}
            onPointUpdated={onMarkerPointUpdated}
            title={markerTitle}
          />
          {geoJson && <GeoJSON data={geoJson} />}
          {showOptions && (
            <>
              <MapOptionsEditor />
              <KmlUploader />
              <MapBaseLayerPeriodSelector />
            </>
          )}
          <UtmGrid />
          <ScaleControl position="bottomright" />
          <ZoomControl position="bottomright" />
          <ZoomLevel />
          {/* <WmtsComponent /> */}
          <Ruler />
        </RLMapContainer>
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
  equalEarthAsDefault: PropTypes.bool,
  geoJson: PropTypes.object,
  layers: PropTypes.array,
  markerPoint: PropTypes.object,
  markerTitle: PropTypes.string,
  onMarkerPointChange: PropTypes.func,
  overlayGroups: PropTypes.array,
  showOptions: PropTypes.bool,
}
