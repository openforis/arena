import type { StyleSpecification } from 'maplibre-gl'

import { DEFAULT_BLEND_ZOOM_RANGE } from '@core/geo/equalEarthBlend'

const COUNTRIES_GEOJSON_URL = '/geo/natural-earth-equal-earth-eq2merc.geojson'

// Matches the "UN ClearMap" entry in ./baseLayers.js - duplicated here (rather than
// imported) to avoid a circular import between the two modules (baseLayers.js already
// imports this file).
const UN_CLEAR_MAP_TILE_URL =
  'https://pro-ags1.dfs.un.org/arcgis/rest/services/basemaps/clearmap_webtopo_nolabel_cvw/MapServer/tile/{z}/{y}/{x}'
const UN_CLEAR_MAP_ATTRIBUTION = 'Map data &copy; <a href="https://www.un.org/geospatial/">United Nations</a>'
const UN_CLEAR_MAP_MAX_ZOOM = 8

const { start: BLEND_START_ZOOM, end: BLEND_END_ZOOM } = DEFAULT_BLEND_ZOOM_RANGE

export const equalEarthMapStyle: StyleSpecification = {
  version: 8,
  name: 'equal-earth-experiment',
  sources: {
    countries: {
      type: 'geojson',
      data: COUNTRIES_GEOJSON_URL,
      attribution: 'Natural Earth',
    },
    unClearMap: {
      type: 'raster',
      tiles: [UN_CLEAR_MAP_TILE_URL],
      tileSize: 256,
      maxzoom: UN_CLEAR_MAP_MAX_ZOOM,
      attribution: UN_CLEAR_MAP_ATTRIBUTION,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#ffffff' },
    },
    {
      id: 'un-clearmap-raster',
      type: 'raster',
      source: 'unClearMap',
      paint: {
        'raster-opacity': ['interpolate', ['linear'], ['zoom'], BLEND_START_ZOOM, 0, BLEND_END_ZOOM, 1],
      },
    },
    {
      id: 'country-glow-outer',
      type: 'line',
      source: 'countries',
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': '#226688',
        'line-width': 5,
        'line-opacity': ['interpolate', ['linear'], ['zoom'], BLEND_START_ZOOM, 0.1, BLEND_END_ZOOM, 0],
      },
    },
    {
      id: 'country-glow-inner',
      type: 'line',
      source: 'countries',
      layout: { 'line-join': 'round' },
      paint: {
        'line-color': '#226688',
        'line-width': ['interpolate', ['linear'], ['zoom'], 0, 1.2, 1, 1.6, 2, 2, 3, 2.4],
        'line-opacity': ['interpolate', ['linear'], ['zoom'], BLEND_START_ZOOM, 0.8, BLEND_END_ZOOM, 0],
      },
    },
    {
      id: 'country-fill',
      type: 'fill',
      source: 'countries',
      paint: {
        'fill-color': [
          'match',
          ['get', 'mapcolor7'],
          1,
          '#fdaf6b',
          2,
          '#fdc663',
          3,
          '#fae364',
          4,
          '#d3e46f',
          5,
          '#aadb78',
          6,
          '#a3cec5',
          7,
          '#ceb5cf',
          /* fallback for any unexpected value */ '#cccccc',
        ],
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], BLEND_START_ZOOM, 1, BLEND_END_ZOOM, 0],
      },
    },
    {
      id: 'country-fill-antarctica',
      type: 'fill',
      source: 'countries',
      filter: ['==', ['get', 'admin'], 'ATA'],
      paint: {
        'fill-color': '#f0f8ff',
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], BLEND_START_ZOOM, 1, BLEND_END_ZOOM, 0],
      },
    },
  ],
}
