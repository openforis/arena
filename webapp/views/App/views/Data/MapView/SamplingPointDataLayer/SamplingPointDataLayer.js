import React, { useRef } from 'react'
import { CircleMarker, LayersControl } from 'react-leaflet'
import PropTypes from 'prop-types'

import { MarkerClusterGroup } from '../common'
import { useSamplingPointDataLayer } from './useSamplingPointDataLayer'
import { SamplingPointDataItemPopup } from './SamplingPointDataItemPopup'

const markerRadius = 10

export const SamplingPointDataLayer = (props) => {
  const { markersColor } = props

  const { overlayName, items, points } = useSamplingPointDataLayer(props)

  // Have a Reference to points for opening popups automatically
  const markerRefs = useRef([])

  const openPopupOfUuid = (uuid) => {
    markerRefs.current[uuid].openPopup()
  }

  const getPointIndex = (uuid) => {
    return items.findIndex((item) => item.uuid === uuid)
  }

  const getNextPoint = (uuid) => {
    const index = getPointIndex(uuid)
    return items[(index + 1) % items.length]
  }
  const getPreviousPoint = (uuid) => {
    let index = getPointIndex(uuid)
    return items[index > 0 ? index - 1 : items.length - 1]
  }

  return (
    <LayersControl.Overlay name={overlayName}>
      <MarkerClusterGroup markersColor={markersColor}>
        {points.map((pointFeature) => {
          const { geometry, properties } = pointFeature
          const { itemUuid, itemCodes, location } = properties
          const [longitude, latitude] = geometry.coordinates

          // we have a single point (sampling point item) to render
          return (
            <CircleMarker
              key={itemUuid}
              center={[latitude, longitude]}
              radius={markerRadius}
              color={markersColor}
              ref={(ref) => {
                if (ref != null) markerRefs.current[itemUuid] = ref
              }}
            >
              <SamplingPointDataItemPopup
                location={location}
                codes={itemCodes}
                itemUuid={itemUuid}
                getNextPoint={getNextPoint}
                getPreviousPoint={getPreviousPoint}
                openPopupOfUuid={openPopupOfUuid}
              />
            </CircleMarker>
          )
        })}
      </MarkerClusterGroup>
    </LayersControl.Overlay>
  )
}

SamplingPointDataLayer.propTypes = {
  levelIndex: PropTypes.number,
  markersColor: PropTypes.any,
}

SamplingPointDataLayer.defaultProps = {
  levelIndex: 0,
}
