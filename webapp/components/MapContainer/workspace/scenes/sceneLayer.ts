import L from 'leaflet'
import parseGeoraster from 'georaster'
import GeoRasterLayer from 'georaster-layer-for-leaflet'

import { getScenePixelToColor } from './sceneColors'
import type { SceneBandMix, SceneResult } from './sceneTypes'
import { getSceneCogUrls } from './sceneUrls'

export const SCENE_OVERLAY_PANE = 'arenaSentinel2OverlayPane'

// Overlay scenes sit under vectors (overlayPane is 400).
const OVERLAY_PANE_Z_INDEX = '390'
// Base scenes live in Leaflet's tilePane: above LayersControl's auto-z base layers, below Part 3's custom overlays at 100.
export const SCENE_BASE_Z_INDEX = 50
// Pixels sampled per tile side: lower than the default 256 keeps the three-file band mixes responsive.
const SCENE_LAYER_RESOLUTION = 128

// georaster reads each header twice (main thread, then a worker with no error handling): a failed second read
// would never settle, so the load is raced against this timeout.
const COG_HEADER_TIMEOUT_MS = 60_000

export type CreateSceneLayerParams = {
  map: L.Map
  scene: SceneResult
  bandMix: SceneBandMix
  asBase: boolean
  attribution: string
}

/**
 * Creates the overlay pane of the scene layers once per map (raster panes never catch pointer events).
 *
 * @param {L.Map} map - Map.
 * @param {string} paneName - SCENE_OVERLAY_PANE.
 * @returns {string} The pane name.
 */
export const ensureScenePane = (map: L.Map, paneName: string): string => {
  if (!map.getPane(paneName)) {
    const pane = map.createPane(paneName)
    pane.style.zIndex = OVERLAY_PANE_Z_INDEX
    pane.style.pointerEvents = 'none'
  }
  return paneName
}

/**
 * Rejects when a promise does not settle in time.
 *
 * @param {Promise<T>} promise - Promise to wait for.
 * @param {number} timeoutMs - Timeout in milliseconds.
 * @returns {Promise<T>} The promise result, or a rejection on timeout.
 */
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out reading the scene headers.')), timeoutMs)
    promise.then(resolve, reject).finally(() => clearTimeout(timer))
  })

/**
 * Creates the Leaflet layer of a scene: reads the COG headers (range requests) and returns a GridLayer
 * that reads only the pixels of the visible tiles.
 *
 * @param {CreateSceneLayerParams} params - Map, scene, band mix, base map flag and attribution.
 * @returns {Promise<L.GridLayer>} The layer (not added to the map).
 */
export const createSceneLayer = async ({
  map,
  scene,
  bandMix,
  asBase,
  attribution,
}: CreateSceneLayerParams): Promise<L.GridLayer> => {
  const urls = getSceneCogUrls(scene.thumbnailUrl, bandMix)
  if (!urls) throw new Error(`Scene ${scene.id} has no cloud-optimised GeoTIFF URL.`)
  // georaster also probes `<file>.ovr` with a HEAD request per COG (403/404 on S3): a known library cost.
  const georasters = await withTimeout(Promise.all(urls.map((url) => parseGeoraster(url))), COG_HEADER_TIMEOUT_MS)
  const placement = asBase
    ? { pane: 'tilePane', zIndex: SCENE_BASE_Z_INDEX }
    : { pane: ensureScenePane(map, SCENE_OVERLAY_PANE) }
  return new GeoRasterLayer({
    georasters,
    ...placement,
    attribution,
    resolution: SCENE_LAYER_RESOLUTION,
    pixelValuesToColorFn: getScenePixelToColor(bandMix),
  }) as L.GridLayer
}
