import './Map.scss'

import React from 'react'
import { MapContainer, Marker, Popup } from 'react-leaflet'
import PropTypes from 'prop-types'

import { Points } from '@openforis/arena-core'

import { ButtonSave } from '@webapp/components'
import Markdown from '@webapp/components/markdown'

import i18n from '@core/i18n/i18nFactory'

import { MapLayersControl } from './MapLayersControl'
import { useMap } from './useMap'

// start of workaround to show leaflet marker icon
import leaflet from 'leaflet'
leaflet.Marker.prototype.options.icon = leaflet.icon({
  iconSize: [25, 41],
  iconAnchor: [10, 41],
  popupAnchor: [2, -40],
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
})
// end of workaround

export const Map = (props) => {
  const { editable, layers } = props
  const {
    centerPositionLatLon,
    markerDescription,
    markerEventHandlers,
    markerPositionLatLon,
    markerPointUpdated,
    markerRef,
    onSaveClick,
  } = useMap(props)

  if (!centerPositionLatLon) {
    return null
  }

  return (
    <div className={`map-wrapper${editable ? ' editable' : ''}`}>
      {editable && <div className="location-edit-info">{i18n.t('mapView.locationEditInfo')}</div>}

      <MapContainer center={centerPositionLatLon} zoom={4}>
        <MapLayersControl layers={layers} />
        {markerPositionLatLon && (
          <Marker
            draggable={editable}
            eventHandlers={markerEventHandlers}
            position={markerPositionLatLon}
            ref={markerRef}
          >
            <Popup>
              <Markdown source={markerDescription} />
            </Popup>
          </Marker>
        )}
      </MapContainer>

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
}

Map.defaultProps = {
  centerPoint: null,
  editable: false,
  layers: [],
  markerPoint: null,
  markerTitle: null,
  onMarkerPointChange: null,
}
