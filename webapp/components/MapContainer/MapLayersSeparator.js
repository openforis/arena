import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import PropTypes from 'prop-types'

/**
 * Injects a horizontal separator into the Leaflet layers control overlays list after
 * the first `count` overlay items. Must be rendered as a sibling of (and after) the
 * LayersControl component so that Leaflet has already created the overlays DOM by the
 * time this component's effect runs.
 * @param {object} props - Component props.
 * @param {number} props.count - Number of overlays after which the separator is inserted.
 * @returns {null} Renders nothing.
 */
export const MapLayersSeparator = ({ count }) => {
  const map = useMap()

  useEffect(() => {
    if (count <= 0) return

    const container = map.getContainer()
    const overlaysList = container.querySelector('.leaflet-control-layers-overlays')
    if (!overlaysList) return

    const separator = document.createElement('div')
    separator.className = 'leaflet-control-layers-separator'
    const referenceNode = overlaysList.children[count]
    if (referenceNode) {
      overlaysList.insertBefore(separator, referenceNode)
    } else {
      overlaysList.appendChild(separator)
    }

    return () => {
      separator.parentNode?.removeChild(separator)
    }
  }, [map, count])

  return null
}

MapLayersSeparator.propTypes = {
  count: PropTypes.number.isRequired,
}
