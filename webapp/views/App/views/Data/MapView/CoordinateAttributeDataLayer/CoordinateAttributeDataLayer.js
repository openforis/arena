import React, { useCallback, useRef } from 'react'
import { LayersControl } from 'react-leaflet'
import L from 'leaflet'
import PropTypes from 'prop-types'

import { MarkerClusterGroup } from '../common'
import { CoordinateAttributeMarker } from './CoordinateAttributeMarker'
import { useCoordinateAttributeDataLayer } from './useCoordinateAttributeDataLayer'

window.arenaMapOpenCoordinateAttributeMarkerPopup = (markerId, clusterId) => {
  const map = window.arenaMap
  map.closePopup() //which will close all popups
  map.eachLayer((layer) => {
    const { _leaflet_id: layerId } = layer
    if (layerId === clusterId) {
      // layer is markerCluster
      layer.spiderfy() //spiederfies our cluster
    } else if (layerId === markerId) {
      // layer is marker
      layer.openPopup()
    }
  })
}

export const CoordinateAttributeDataLayer = (props) => {
  const { attributeDef, markersColor, onRecordEditClick } = props

  const { layerName, points } = useCoordinateAttributeDataLayer(props)

  // Have a Reference to points for opening popups automatically
  const markerRefs = useRef([])
  const openPopupOfUuid = useCallback((uuid) => {
    const marker = markerRefs.current[uuid]
    // spiderify parent (if any)
    marker?.__parent?.spiderfy()
    // open popup
    marker?.openPopup()
  }, [])

  const getPointIndex = useCallback((uuid) => points.findIndex((item) => item.properties.parentUuid === uuid), [points])

  const getNextPoint = useCallback(
    (uuid) => {
      const index = getPointIndex(uuid)
      return points[(index + 1) % points.length]
    },
    [getPointIndex, points]
  )

  const getPreviousPoint = useCallback(
    (uuid) => {
      const index = getPointIndex(uuid)
      return points[index > 0 ? index - 1 : points.length - 1]
    },
    [getPointIndex, points]
  )

  const setRef = useCallback((parentUuid, ref) => {
    if (ref != null) markerRefs.current[parentUuid] = ref.current
  }, [])

  const onClusterClick = useCallback((e) => {
    const { layer } = e
    const { _map: map } = layer
    if (layer._zoom === map?._layersMaxZoom) {
      const { _markers: markers, _leaflet_id: clusterId } = layer
      const coordinateAttributeMarkers = markers.filter((marker) => marker?.options?.data?.recordUuid)
      const { lat, lng } = layer._cLatLng
      const popUpText = `<ul>${coordinateAttributeMarkers
        .map((marker) => {
          const { _leaflet_id: markerId } = marker
          const { ancestorsKeys = [] } = marker.options?.data || {}

          const ancestorsKeysString = ancestorsKeys.join(' - ')
          return `<li><a onclick="arenaMapOpenCoordinateAttributeMarkerPopup(${markerId},${clusterId})">${ancestorsKeysString}</a></li>`
        })
        .join('')}</ul>`

      L.popup().setLatLng([lat, lng]).setContent(popUpText).openOn(map)
    }
  }, [])

  return (
    <LayersControl.Overlay name={layerName}>
      <MarkerClusterGroup markersColor={markersColor} onClick={onClusterClick}>
        {points.map((pointFeature) => {
          const { geometry, properties } = pointFeature
          const { ancestorsKeys, key, parentUuid, point, recordUuid } = properties
          const [longitude, latitude] = geometry.coordinates

          return (
            <CoordinateAttributeMarker
              key={key}
              ancestorsKeys={ancestorsKeys}
              attributeDef={attributeDef}
              latitude={latitude}
              longitude={longitude}
              markersColor={markersColor}
              parentUuid={parentUuid}
              point={point}
              recordUuid={recordUuid}
              onRecordEditClick={onRecordEditClick}
              getNextPoint={getNextPoint}
              getPreviousPoint={getPreviousPoint}
              openPopupOfUuid={openPopupOfUuid}
              setRef={setRef}
            />
          )
        })}
      </MarkerClusterGroup>
    </LayersControl.Overlay>
  )
}

CoordinateAttributeDataLayer.propTypes = {
  attributeDef: PropTypes.any,
  markersColor: PropTypes.any,
  onRecordEditClick: PropTypes.func,
}
