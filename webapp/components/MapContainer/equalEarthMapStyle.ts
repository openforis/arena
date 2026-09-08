import type { StyleSpecification } from 'maplibre-gl'

const COUNTRIES_GEOJSON_URL = '/geo/natural-earth-equal-earth-eq2merc.geojson'

export const equalEarthMapStyle: StyleSpecification = {
  version: 8,
  name: 'equal-earth-experiment',
  sources: {
    countries: {
      type: 'geojson',
      data: COUNTRIES_GEOJSON_URL,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#eef6fb' },
    },
    {
      id: 'countries-fill',
      type: 'fill',
      source: 'countries',
      paint: { 'fill-color': '#a3cec5', 'fill-opacity': 0.9 },
    },
    {
      id: 'countries-outline',
      type: 'line',
      source: 'countries',
      paint: { 'line-color': '#226688', 'line-width': 0.75 },
    },
  ],
}
