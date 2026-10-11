import type { SceneBandMix } from './sceneTypes'

// Earth Search COGs live on S3; anything else in the index is not fetched.
export const SCENE_COG_HOST_PATTERN = /(^|\.)amazonaws\.com$/

export const SCENE_BAND_MIXES: SceneBandMix[] = ['trueColour', 'falseColourVegetation', 'swir']

// TCI is the 3-band uint8 true colour COG; the mixes read one uint16 COG per band.
export const SCENE_BAND_FILES: Record<SceneBandMix, string[]> = {
  trueColour: ['TCI'],
  falseColourVegetation: ['B08', 'B04', 'B03'],
  swir: ['B12', 'B8A', 'B04'],
}

/**
 * Returns the folder of a scene's files from its thumbnail URL (…/L2A_PVI.jpg).
 *
 * @param {string|null} thumbnailUrl - Thumbnail URL from the index.
 * @returns {string|null} Folder URL ending with a slash, or null when the URL is not an https S3 URL.
 */
export const getSceneDirectoryUrl = (thumbnailUrl: string | null): string | null => {
  if (!thumbnailUrl) return null
  let url: URL
  try {
    url = new URL(thumbnailUrl)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || !SCENE_COG_HOST_PATTERN.test(url.hostname)) return null
  const lastSlash = url.pathname.lastIndexOf('/')
  return lastSlash > 0 ? `${url.origin}${url.pathname.slice(0, lastSlash + 1)}` : null
}

/**
 * Returns the COG URLs to read for a scene and band mix.
 *
 * @param {string|null} thumbnailUrl - Thumbnail URL from the index.
 * @param {SceneBandMix} bandMix - Band mix.
 * @returns {string[]|null} One URL per band file, or null when the scene has no usable URL.
 */
export const getSceneCogUrls = (thumbnailUrl: string | null, bandMix: SceneBandMix): string[] | null => {
  const directory = getSceneDirectoryUrl(thumbnailUrl)
  return directory ? SCENE_BAND_FILES[bandMix].map((band) => `${directory}${band}.tif`) : null
}
