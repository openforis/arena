import React, { useCallback, useRef } from 'react'
import { LayersControl } from 'react-leaflet'
import PropTypes from 'prop-types'

import { MarkerClusterGroup } from '../common'
import { CoordinateAttributeMarker } from './CoordinateAttributeMarker'
import { useCoordinateAttributeDataLayer } from './useCoordinateAttributeDataLayer'

export const CoordinateAttributeDataLayer = (props) => {
  const { attributeDef, markersColor, onRecordEditClick } = props

  const { layerName, points } = useCoordinateAttributeDataLayer(props)

  // Have a Reference to points for opening popups automatically
  let markerRefs = useRef([])
  const openPopupOfUuid = (uuid) => {
    markerRefs.current[uuid].openPopup()
  }

  const getPointIndex = (uuid) => {
    return points.findIndex((item) => {
      return item.properties.parentUuid === uuid
    })
  }

  const getNextPoint = (uuid) => {
    const index = getPointIndex(uuid)
    return points[(index + 1) % points.length]
  }
  const getPreviousPoint = (uuid) => {
    let index = getPointIndex(uuid)
    return points[index > 0 ? index - 1 : points.length - 1]
  }

  const setRef = useCallback(
    (parentUuid, ref) => {
      if (ref != null) markerRefs.current[parentUuid] = ref.current
    },
    [points]
  )

  return (
    <LayersControl.Overlay name={layerName}>
      <MarkerClusterGroup markersColor={markersColor}>
        {points.map((pointFeature) => {
          const { geometry, properties } = pointFeature
          const { key } = properties

          const { recordUuid, parentUuid, ancestorsKeys, point } = properties
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
