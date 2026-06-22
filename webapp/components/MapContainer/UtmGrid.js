import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

import { useMapContextOptions } from './MapContext'
import { MapOptions } from './mapOptions'

const BAND_LATS = [-80, -72, -64, -56, -48, -40, -32, -24, -16, -8, 0, 8, 16, 24, 32, 40, 48, 56, 64, 72, 84]
const BAND_LETTERS = 'CDEFGHJKLMNPQRSTUVWX'
const LINE_STYLE = { color: '#ffd900', weight: 1, opacity: 0.65, interactive: false }
const LABEL_ZOOM_THRESHOLD = 4

// Returns canonical zone boundary longitudes in [-180, 180] for a given band.
// Encodes the Norway (band V) and Svalbard (band X) UTM exceptions.
const getCanonicalBoundaries = (bandSouthLat) => {
  if (bandSouthLat === 56) {
    // Band V (56°–64°): zone 32V spans 3°E–12°E instead of 6°E–12°E
    const boundaries = []
    for (let lng = -180; lng <= 180; lng += 6) {
      if (lng !== 6) boundaries.push(lng)
    }
    boundaries.push(3)
    return boundaries.sort((a, b) => a - b)
  }
  if (bandSouthLat === 72) {
    // Band X (72°–84°): zones 32X/34X/36X don't exist; 31X/33X/35X/37X are wider
    const skip = new Set([6, 12, 18, 24, 30, 36])
    const boundaries = []
    for (let lng = -180; lng <= 180; lng += 6) {
      if (!skip.has(lng)) boundaries.push(lng)
    }
    for (let k = 0; k < [9, 21, 33, 42].length; k++) {
      boundaries.push([9, 21, 33, 42][k])
    }
    return boundaries.sort((a, b) => a - b)
  }
  // Standard: every 6°
  const boundaries = []
  for (let lng = -180; lng <= 180; lng += 6) boundaries.push(lng)
  return boundaries
}

// Normalize any longitude to [-180, 180)
const normalizeLng = (lng) => ((((lng + 180) % 360) + 360) % 360) - 180

// Expand canonical [-180,180] boundaries to cover the visible [westLng, eastLng] range,
// including wrapped copies of the world.
const expandBoundaries = (canonical, westLng, eastLng) => {
  const result = new Set()
  const firstOffset = Math.floor((westLng + 180) / 360) * 360
  const lastOffset = Math.ceil((eastLng - 180) / 360) * 360
  for (let offset = firstOffset - 360; offset <= lastOffset + 360; offset += 360) {
    for (let k = 0; k < canonical.length; k++) {
      const lng = canonical[k] + offset
      if (lng >= westLng && lng <= eastLng) result.add(lng)
    }
  }
  return [...result].sort((a, b) => a - b)
}

export const UtmGrid = () => {
  const map = useMap()
  const options = useMapContextOptions()
  const showUtmGrid = options[MapOptions.keys.showUtmGrid]

  useEffect(() => {
    if (!showUtmGrid) return

    const layerGroup = L.layerGroup().addTo(map)

    const drawGrid = () => {
      layerGroup.clearLayers()

      const bounds = map.getBounds()
      const west = bounds.getWest()
      const east = bounds.getEast()
      const south = Math.max(-80, bounds.getSouth())
      const north = Math.min(84, bounds.getNorth())

      // Horizontal band boundary lines
      for (let i = 0; i < BAND_LATS.length; i++) {
        const lat = BAND_LATS[i]
        if (lat >= south - 8 && lat <= north + 8) {
          L.polyline(
            [
              [lat, west - 6],
              [lat, east + 6],
            ],
            LINE_STYLE
          ).addTo(layerGroup)
        }
      }

      // Vertical zone boundary lines — drawn per band to handle Norway/Svalbard exceptions
      for (let i = 0; i < BAND_LATS.length - 1; i++) {
        const bandSouth = BAND_LATS[i]
        const bandNorth = BAND_LATS[i + 1]
        if (bandNorth <= south - 8 || bandSouth >= north + 8) continue

        const canonical = getCanonicalBoundaries(bandSouth)
        const boundaries = expandBoundaries(canonical, west - 6, east + 6)
        for (let k = 0; k < boundaries.length; k++) {
          const lng = boundaries[k]
          L.polyline(
            [
              [bandSouth, lng],
              [bandNorth, lng],
            ],
            LINE_STYLE
          ).addTo(layerGroup)
        }
      }

      // Zone labels
      if (map.getZoom() >= LABEL_ZOOM_THRESHOLD) {
        for (let i = 0; i < BAND_LATS.length - 1; i++) {
          const bandSouth = BAND_LATS[i]
          const bandNorth = BAND_LATS[i + 1]
          const bandLetter = BAND_LETTERS[i]
          if (bandNorth <= south || bandSouth >= north) continue

          const canonical = getCanonicalBoundaries(bandSouth)
          const boundaries = expandBoundaries(canonical, west - 6, east + 6)
          const centerLat = (bandSouth + bandNorth) / 2

          for (let j = 0; j < boundaries.length - 1; j++) {
            const centerLng = (boundaries[j] + boundaries[j + 1]) / 2
            if (centerLng < west || centerLng > east) continue

            const zoneNum = Math.floor((normalizeLng(centerLng) + 180) / 6) + 1

            L.marker([centerLat, centerLng], {
              icon: L.divIcon({
                className: 'utm-grid-label',
                html: `${zoneNum}${bandLetter}`,
                iconSize: [32, 16],
                iconAnchor: [16, 8],
              }),
              interactive: false,
              keyboard: false,
            }).addTo(layerGroup)
          }
        }
      }
    }

    drawGrid()
    map.on('moveend zoomend', drawGrid)

    return () => {
      map.off('moveend zoomend', drawGrid)
      map.removeLayer(layerGroup)
    }
  }, [map, showUtmGrid])

  return null
}
