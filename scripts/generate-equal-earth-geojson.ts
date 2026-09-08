import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { warpLonLatToEqualEarthInMercator } from '../core/geo/equalEarthProjection.ts'

const SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
const OUTPUT_PATH = resolve(
  import.meta.dirname,
  '..',
  'web-resources',
  'geo',
  'natural-earth-equal-earth-eq2merc.geojson'
)

type Position = number[]
type CoordinateTree = Position | CoordinateTree[]

const isPosition = (value: CoordinateTree): value is Position => Array.isArray(value) && typeof value[0] === 'number'

const warpCoordinateTree = (coordinates: CoordinateTree): CoordinateTree => {
  if (isPosition(coordinates)) {
    const [lon, lat] = coordinates
    const warped = warpLonLatToEqualEarthInMercator({ lon, lat })
    return [warped.lon, warped.lat]
  }
  return coordinates.map(warpCoordinateTree)
}

interface NaturalEarthFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: { type: string; coordinates: CoordinateTree }
}

interface NaturalEarthFeatureCollection {
  type: 'FeatureCollection'
  features: NaturalEarthFeature[]
}

const run = async (): Promise<void> => {
  console.log(`Fetching Natural Earth countries data from ${SOURCE_URL}`)
  const response = await fetch(SOURCE_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch source data: ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as NaturalEarthFeatureCollection

  const warpedFeatureCollection = {
    type: 'FeatureCollection',
    features: data.features.map((feature) => ({
      type: 'Feature',
      properties: { admin: feature.properties.ADM0_A3 },
      geometry: {
        type: feature.geometry.type,
        coordinates: warpCoordinateTree(feature.geometry.coordinates),
      },
    })),
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
  writeFileSync(OUTPUT_PATH, JSON.stringify(warpedFeatureCollection))
  console.log(`Wrote ${warpedFeatureCollection.features.length} warped country features to ${OUTPUT_PATH}`)
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
