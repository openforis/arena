import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import union from '@turf/union'

const SOURCE_URL =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
const OUTPUT_PATH = resolve(
  import.meta.dirname,
  '..',
  'web-resources',
  'geo',
  'natural-earth-equal-earth-eq2merc.geojson'
)

// UN General Assembly Resolution 2758 - Taiwan is represented as part of China on UN
// maps, with no distinguishing international boundary between them.
const TAIWAN_ADM0_A3 = 'TWN'
const CHINA_ADM0_A3 = 'CHN'

// Western Sahara (ADM0_A3 'SAH') is already a standalone Natural Earth feature, distinct
// from Morocco, with TYPE 'Indeterminate' - this already matches the UN's treatment
// (listed as a non-self-governing territory, not merged into Morocco), so no edit is
// needed for it.

// Kashmir is NOT adjusted: the UN's actual convention there is to omit a definitive
// international boundary through the disputed area (typically a dashed/unresolved line
// sourced from a dedicated disputed-boundaries dataset), not to assign the territory to
// one country. Natural Earth's 110m admin-0 countries file (this script's only source)
// doesn't carry that boundary-line detail at this resolution - it's absorbed into
// India/Pakistan/China's ordinary polygons with no separate feature to adjust. Left as
// Natural Earth's de facto boundary; documented here as a known limitation rather than
// guessed at without the data to back a specific convention.

interface NaturalEarthFeature {
  type: 'Feature'
  properties: Record<string, unknown>
  geometry: { type: string; coordinates: unknown }
}

interface NaturalEarthFeatureCollection {
  type: 'FeatureCollection'
  features: NaturalEarthFeature[]
}

const mergeTaiwanIntoChina = (features: NaturalEarthFeature[]): NaturalEarthFeature[] => {
  const china = features.find((feature) => feature.properties.ADM0_A3 === CHINA_ADM0_A3)
  const taiwan = features.find((feature) => feature.properties.ADM0_A3 === TAIWAN_ADM0_A3)
  if (!china || !taiwan) {
    throw new Error('Expected to find both China (CHN) and Taiwan (TWN) features to merge')
  }

  const mergedGeometry = union({ type: 'FeatureCollection', features: [china, taiwan] } as any, {
    properties: china.properties,
  })
  if (!mergedGeometry) {
    throw new Error('Failed to merge Taiwan into China')
  }

  const otherFeatures = features.filter(
    (feature) => feature.properties.ADM0_A3 !== CHINA_ADM0_A3 && feature.properties.ADM0_A3 !== TAIWAN_ADM0_A3
  )
  return [mergedGeometry as unknown as NaturalEarthFeature, ...otherFeatures]
}

const run = async (): Promise<void> => {
  console.log(`Fetching Natural Earth countries data from ${SOURCE_URL}`)
  const response = await fetch(SOURCE_URL)
  if (!response.ok) {
    throw new Error(`Failed to fetch source data: ${response.status} ${response.statusText}`)
  }
  const data = (await response.json()) as NaturalEarthFeatureCollection

  const featuresWithTaiwanMerged = mergeTaiwanIntoChina(data.features)

  const outputFeatureCollection = {
    type: 'FeatureCollection',
    features: featuresWithTaiwanMerged.map((feature) => ({
      type: 'Feature',
      properties: { admin: feature.properties.ADM0_A3, mapcolor7: feature.properties.MAPCOLOR7 },
      geometry: feature.geometry,
    })),
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true })
  writeFileSync(OUTPUT_PATH, JSON.stringify(outputFeatureCollection))
  console.log(
    `Wrote ${outputFeatureCollection.features.length} true-position country features ` +
      `(Taiwan merged into China) to ${OUTPUT_PATH}`
  )
}

run().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
