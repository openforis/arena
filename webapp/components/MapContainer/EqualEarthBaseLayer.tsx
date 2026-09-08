import { createElementObject, createLayerComponent, type LayerProps } from '@react-leaflet/core'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import type { MaplibreGL as MaplibreGLLayer } from 'leaflet'
import type { StyleSpecification } from 'maplibre-gl'

// The warped GeoJSON this layer renders only reads as an Equal Earth
// projection near the world-overview scale; past this zoom the fixed warp
// increasingly diverges from true geography, so zooming further in is capped.
const EQUAL_EARTH_MAX_ZOOM = 2

export interface EqualEarthBaseLayerProps extends LayerProps {
  style: StyleSpecification
}

export const EqualEarthBaseLayer = createLayerComponent<MaplibreGLLayer, EqualEarthBaseLayerProps>(
  function createEqualEarthBaseLayer({ style, ...options }, context) {
    const layer = maplibreGL({ style, ...options })
    let previousMaxZoom: number | undefined

    layer.on('add', () => {
      const { map } = context
      previousMaxZoom = map.options.maxZoom
      map.setMaxZoom(EQUAL_EARTH_MAX_ZOOM)
      if (map.getZoom() > EQUAL_EARTH_MAX_ZOOM) {
        map.setZoom(EQUAL_EARTH_MAX_ZOOM)
      }
    })
    layer.on('remove', () => {
      // Leaflet's own MapOptions.maxZoom type doesn't reflect the "unset" state,
      // even though the runtime treats undefined as "no explicit override, fall
      // back to the active layer's own maxZoom" (see Map.getMaxZoom()).
      context.map.options.maxZoom = previousMaxZoom as number
    })

    return createElementObject(layer, context)
  }
)
