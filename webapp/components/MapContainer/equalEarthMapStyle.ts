import type { StyleSpecification } from 'maplibre-gl'

const COUNTRIES_GEOJSON_URL = '/geo/natural-earth-equal-earth-eq2merc.geojson'

// Matches the "UN ClearMap" entry in ./baseLayers.js - duplicated here (rather than
// imported) to avoid a circular import between the two modules (baseLayers.js already
// imports this file).
const UN_CLEAR_MAP_TILE_URL =
  'https://pro-ags1.dfs.un.org/arcgis/rest/services/basemaps/clearmap_webtopo_nolabel_cvw/MapServer/tile/{z}/{y}/{x}'
const UN_CLEAR_MAP_ATTRIBUTION = 'Map data &copy; <a href="https://www.un.org/geospatial/">United Nations</a>'
const UN_CLEAR_MAP_MAX_ZOOM = 8

// The vector country layers below (Natural Earth-derived, heavily simplified) never
// pixel-align with UN ClearMap's own raster boundaries. A gradual cross-fade would show
// both simultaneously and expose that mismatch as a shimmering double-boundary
// artifact, so instead of fading, this style cuts over instantly at one zoom level -
// the two boundary datasets are never visible at the same time, so the mismatch is
// never seen even though the underlying data still differs. This is independent of
// EqualEarthBaseLayer.tsx's own position blend (still a smooth zoom 4-8 fade from the
// Equal Earth warp to true positions) - that part is unaffected by this constant.
const RASTER_CUTOVER_ZOOM = 7

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
        'raster-opacity': ['step', ['zoom'], 0, RASTER_CUTOVER_ZOOM, 1],
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
        'line-opacity': ['step', ['zoom'], 0.1, RASTER_CUTOVER_ZOOM, 0],
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
        'line-opacity': ['step', ['zoom'], 0.8, RASTER_CUTOVER_ZOOM, 0],
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
        'fill-opacity': ['step', ['zoom'], 1, RASTER_CUTOVER_ZOOM, 0],
      },
    },
    {
      id: 'country-fill-antarctica',
      type: 'fill',
      source: 'countries',
      filter: ['==', ['get', 'admin'], 'ATA'],
      paint: {
        'fill-color': '#f0f8ff',
        'fill-opacity': ['step', ['zoom'], 1, RASTER_CUTOVER_ZOOM, 0],
      },
    },
  ],
}
