import './Map.scss'

import React from 'react'
import { GeoJSON, MapContainer as RLMapContainer, ScaleControl, ZoomControl } from 'react-leaflet'
import Ruler from 'react-leaflet-ruler'
import PropTypes from 'prop-types'

import { ButtonSave } from '@webapp/components'

import i18n from '@core/i18n/i18nFactory'

import { MapLayersControl } from './MapLayersControl'
import { MapMarker } from './MapMarker'
import { MapOptionsEditor } from './MapOptionsEditor'
import { MapContextProvider } from './MapContext'
import { useMap } from './useMap'

import { MapBaseLayerPeriodSelector } from './MapBaseLayerPeriodSelector'
import { KmlUploader } from './KmlUploader'
import { ZoomLevel } from './ZoomLevel'

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

export const MapContainer = (props) => {
  const { editable = false, geoJson = null, layers = [], markerPoint, markerTitle, showOptions = true } = props
  const { centerPositionLatLon, markerPointUpdated, markerPointUpdatedToString, onMarkerPointUpdated, onSaveClick } =
    useMap(props)

  if (!centerPositionLatLon) {
    return null
  }

  const markerPointUpdatedValid =
    markerPointUpdated && Number.isFinite(markerPointUpdated.x) && Number.isFinite(markerPointUpdated.y)

  const markerUpdatedText = markerPointUpdatedValid
    ? markerPointUpdatedToString
    : i18n.t('mapView.locationNotValidOrOutOfRange')

  return (
    <div className={`map-wrapper${editable ? ' editable' : ''}`}>
      {editable && <div className="location-edit-info">{i18n.t('mapView.locationEditInfo')}</div>}

      <MapContextProvider>
        <RLMapContainer
          center={centerPositionLatLon}
          doubleClickZoom={false}
          zoomControl={false}
          zoom={INITIAL_ZOOM_LEVEL}
        >
          <MapLayersControl layers={layers} />
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
                {i18n.t('mapView.locationUpdated')}:<span>{markerUpdatedText}</span>
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
  centerPoint: PropTypes.object,
  editable: PropTypes.bool,
  geoJson: PropTypes.object,
  layers: PropTypes.array,
  markerPoint: PropTypes.object,
  markerTitle: PropTypes.string,
  onMarkerPointChange: PropTypes.func,
  showOptions: PropTypes.bool,
}
