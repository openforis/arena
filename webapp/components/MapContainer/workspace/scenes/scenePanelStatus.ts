import { MAX_SCENE_TILES } from './mgrsTiles'
import type { MgrsTilesResult, SceneAreaKey, ScenePanelStatusKind } from './sceneTypes'

export const SCENE_AREA_KEYS: SceneAreaKey[] = ['view', 'plot', 'draw']

export type ScenePanelStatusInput = {
  areaKey: SceneAreaKey
  hasBounds: boolean
  drawing: boolean
  tilesStatus: MgrsTilesResult['status'] | null
  loading: boolean
  failed: boolean
  resultCount: number // scenes shown after the filters
}

export type ScenePanelMessage = { key: string; params?: Record<string, number> }

const NO_AREA_STATUS: Record<SceneAreaKey, ScenePanelStatusKind> = {
  view: 'idle',
  plot: 'noPlot',
  draw: 'noDrawnArea',
}

const MESSAGE_PREFIX = 'mapWorkspace.scenes.messages.'
const STATUSES_WITH_MESSAGE = new Set<ScenePanelStatusKind>([
  'drawing',
  'noPlot',
  'noDrawnArea',
  'tooLarge',
  'outside',
  'error',
  'searching',
  'empty',
])

/**
 * Derives what the panel shows from the area, the tiles and the search state.
 *
 * @param {ScenePanelStatusInput} input - Panel state.
 * @returns {ScenePanelStatusKind} Status.
 */
export const getScenePanelStatus = (input: ScenePanelStatusInput): ScenePanelStatusKind => {
  if (input.areaKey === 'draw' && input.drawing) return 'drawing'
  if (!input.hasBounds) return NO_AREA_STATUS[input.areaKey]
  if (input.tilesStatus === 'tooLarge' || input.tilesStatus === 'outside') return input.tilesStatus
  if (input.failed) return 'error'
  if (input.loading) return 'searching'
  return input.resultCount === 0 ? 'empty' : 'results'
}

/**
 * Returns the i18n message of a status.
 *
 * @param {ScenePanelStatusKind} status - Status.
 * @param {number} tileCount - Number of tiles searched.
 * @returns {ScenePanelMessage|null} Message key and params, or null when the status has no message.
 */
export const getScenePanelMessage = (status: ScenePanelStatusKind, tileCount: number): ScenePanelMessage | null => {
  if (!STATUSES_WITH_MESSAGE.has(status)) return null
  const key = `${MESSAGE_PREFIX}${status}`
  if (status === 'tooLarge') return { key, params: { max: MAX_SCENE_TILES } }
  if (status === 'searching') return { key, params: { count: tileCount } }
  return { key }
}
