import './Map.scss'

import React from 'react'
import { MapContainer, ScaleControl } from 'react-leaflet'
import PropTypes from 'prop-types'

import { Points } from '@openforis/arena-core'

import { ButtonSave } from '@webapp/components'

import i18n from '@core/i18n/i18nFactory'

import { MapLayersControl } from './MapLayersControl'
import { MapMarker } from './MapMarker'
import { MapOptionsEditor } from './MapOptionsEditor'
import { MapContextProvider } from './MapContext'
import { useMap } from './useMap'

import { MapBaseLayerPeriodSelector } from './MapBaseLayerPeriodSelector'
import { KmlUploader } from './KmlUploader'
import { ShowZoomLevel } from './ShowZoomLevel'

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

export const Map = (props) => {
  const { editable, layers, markerPoint, markerTitle, showOptions } = props
  const { centerPositionLatLon, mapEventHandlers, markerPointUpdated, onMarkerPointUpdated, onSaveClick } =
    useMap(props)

  if (!centerPositionLatLon) {
    return null
  }

  return (
    <div className={`map-wrapper${editable ? ' editable' : ''}`}>
      {editable && <div className="location-edit-info">{i18n.t('mapView.locationEditInfo')}</div>}

      <MapContextProvider>
        <MapContainer
          center={centerPositionLatLon}
          doubleClickZoom={false}
          zoom={initialZoomLevel}
          eventHandlers={mapEventHandlers}
        >
          <ScaleControl position="topleft" />
          <MapLayersControl layers={layers} />
          <MapMarker
            editable={editable}
            point={markerPoint}
            onPointUpdated={onMarkerPointUpdated}
            title={markerTitle}
          />
          {showOptions && <MapOptionsEditor />}
          <KmlUploader />
          <MapBaseLayerPeriodSelector />
          <ShowZoomLevel />
          {/* <WmtsComponent /> */}
        </MapContainer>
      </MapContextProvider>

      {editable && (
        <div className="button-bar">
          {markerPointUpdated && (
            <div className="location-updated-label">
              <label>
                {i18n.t('mapView.locationUpdated')}:<span>{Points.toString(markerPointUpdated)}</span>
              </label>
            </div>
          )}
          <ButtonSave disabled={!markerPointUpdated} onClick={onSaveClick} />
        </div>
      )}
    </div>
  )
}

Map.propTypes = {
  centerPoint: PropTypes.object,
  editable: PropTypes.bool,
  layers: PropTypes.array,
  markerPoint: PropTypes.object,
  markerTitle: PropTypes.string,
  onMarkerPointChange: PropTypes.func,
  showOptions: PropTypes.bool,
}

Map.defaultProps = {
  centerPoint: null,
  editable: false,
  layers: [],
  markerPoint: null,
  markerTitle: null,
  onMarkerPointChange: null,
  showOptions: true,
}
