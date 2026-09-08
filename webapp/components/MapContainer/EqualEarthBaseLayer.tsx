import { createElementObject, createLayerComponent, type LayerProps } from '@react-leaflet/core'
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet'
import type { MaplibreGL as MaplibreGLLayer } from 'leaflet'
import type { GeoJSONSource, StyleSpecification } from 'maplibre-gl'

import {
  DEFAULT_BLEND_ZOOM_RANGE,
  blendCountryFeatureCollection,
  getBlendFactor,
  type CountryFeatureCollection,
} from '@core/geo/equalEarthBlend'

const COUNTRIES_GEOJSON_URL = '/geo/natural-earth-equal-earth-eq2merc.geojson'
const COUNTRIES_SOURCE_ID = 'countries'

export interface EqualEarthBaseLayerProps extends LayerProps {
  style: StyleSpecification
}

export const EqualEarthBaseLayer = createLayerComponent<MaplibreGLLayer, EqualEarthBaseLayerProps>(
  function createEqualEarthBaseLayer({ style, ...options }, context) {
    const layer = maplibreGL({ style, ...options })

    let trueData: CountryFeatureCollection | null = null
    let pendingFrame: number | null = null
    let removed = false

    const applyBlend = (): void => {
      pendingFrame = null
      if (!trueData || removed) return
      const source = layer.getMaplibreMap().getSource(COUNTRIES_SOURCE_ID) as GeoJSONSource | undefined
      const blend = getBlendFactor(context.map.getZoom(), DEFAULT_BLEND_ZOOM_RANGE)
      // blendCountryFeatureCollection's return shape matches GeoJSON.GeoJSON structurally,
      // but isn't declared against the strict 'geojson' package types this project doesn't
      // otherwise depend on for this data - cast at this one boundary.
      source?.setData(blendCountryFeatureCollection(trueData, blend) as any)
    }

    const scheduleBlend = (): void => {
      if (pendingFrame !== null || removed) return
      pendingFrame = requestAnimationFrame(applyBlend)
    }

    fetch(COUNTRIES_GEOJSON_URL)
      .then((response) => response.json())
      .then((data: CountryFeatureCollection) => {
        if (removed) return
        trueData = data
        scheduleBlend()
      })
      .catch(() => {
        // Fetch failed - the style's own static source URL (equalEarthMapStyle.ts) keeps
        // rendering the unblended, true-position countries as a fallback.
      })

    layer.on('add', () => {
      removed = false
      context.map.on('zoom', scheduleBlend)
      scheduleBlend()
    })
    layer.on('remove', () => {
      removed = true
      context.map.off('zoom', scheduleBlend)
      if (pendingFrame !== null) {
        cancelAnimationFrame(pendingFrame)
        pendingFrame = null
      }
    })

    return createElementObject(layer, context)
  }
)
