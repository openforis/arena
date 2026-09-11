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
    let fetchStarted = false
    let pendingFrame: number | null = null
    let removed = false

    const applyBlend = (): void => {
      pendingFrame = null
      if (!trueData || removed) return
      // react-leaflet mounts every declared base layer (checked or not) at component
      // creation time, so this can run for a layer that was never actually added to the
      // map (e.g. the record-editing coordinate picker, where Equal Earth is present in
      // the switcher but not selected) - getMaplibreMap() is only populated once onAdd
      // has actually run, so guard against it being unset.
      const maplibreMap = layer.getMaplibreMap()
      if (!maplibreMap) return
      const source = maplibreMap.getSource(COUNTRIES_SOURCE_ID) as GeoJSONSource | undefined
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

    // Only starts once the layer is actually added to the map (not just mounted) - the
    // record-editing coordinate picker mounts this component without ever adding it
    // (Equal Earth isn't its default layer there), and there's no reason to fetch 250KB
    // of data for a layer nobody selected.
    const ensureDataFetched = (): void => {
      if (fetchStarted) return
      fetchStarted = true
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
    }

    layer.on('add', () => {
      removed = false
      ensureDataFetched()
      context.map.on('zoom', scheduleBlend)
      scheduleBlend()
    })
    layer.on('remove', () => {
      removed = true
      // If the fetch never resolved (or resolved but its result was discarded because
      // `removed` was already true by then), reset the guard so a future re-add retries
      // it - otherwise the layer is permanently stuck with no data for the rest of the
      // page session. Once trueData is populated, though, it stays valid indefinitely
      // (the country data doesn't change at runtime), so don't refetch needlessly.
      if (!trueData) {
        fetchStarted = false
      }
      context.map.off('zoom', scheduleBlend)
      if (pendingFrame !== null) {
        cancelAnimationFrame(pendingFrame)
        pendingFrame = null
      }
    })

    return createElementObject(layer, context)
  }
)
