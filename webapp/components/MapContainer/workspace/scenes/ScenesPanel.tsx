import './ScenesPanel.scss'

import React, { useMemo, useState } from 'react'
import Button from '@mui/material/Button'
import { useMap } from 'react-leaflet'

import { useMapWorkspace } from '@webapp/components/MapContainer/workspace/MapWorkspaceContext'
import { useI18nT } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { getMgrsTilesForBounds } from './mgrsTiles'
import { DEFAULT_SCENE_FILTERS, filterScenes, filterScenesByMonth, sortScenes } from './sceneFilters'
import { getMonthHistogram } from './sceneHistogram'
import { getScenePanelMessage, getScenePanelStatus } from './scenePanelStatus'
import type { ScenePanelMessage } from './scenePanelStatus'
import { DEFAULT_SCENE_PERIOD_MONTHS, getScenePeriod } from './scenePeriod'
import type {
  MgrsTilesResult,
  MonthBucket,
  SceneBandMix,
  SceneFilters,
  ScenePanelStatusKind,
  ScenePeriodMonths,
  SceneResult,
  SceneSort,
} from './sceneTypes'
import { ScenesBandsControl } from './ScenesBandsControl'
import { ScenesAreaControl, ScenesPercentSlider, ScenesPeriodControl } from './ScenesFilterControls'
import { ScenesMonthChart } from './ScenesMonthChart'
import { ScenesResults } from './ScenesResults'
import { useSceneArea } from './useSceneArea'
import { useSceneFootprint } from './useSceneFootprint'
import { useSceneLayers } from './useSceneLayers'
import { useSceneSearch } from './useSceneSearch'

const NO_TILES: string[] = []
const CHART_STATUSES = new Set<ScenePanelStatusKind>(['results', 'empty', 'searching'])

/**
 * Returns a stable key of the tiles to search ('' when nothing is searched).
 *
 * @param {MgrsTilesResult|null} tilesResult - Tiles of the area.
 * @returns {string} Comma-separated tiles.
 */
const getTilesKey = (tilesResult: MgrsTilesResult | null): string =>
  tilesResult?.status === 'ok' ? tilesResult.tiles.join(',') : ''

/**
 * Keeps the month filter only while that month still has scenes.
 *
 * @param {string|null} monthKey - Chosen month.
 * @param {MonthBucket[]} buckets - Current histogram.
 * @returns {string|null} Month filter in effect.
 */
const getActiveMonthKey = (monthKey: string | null, buckets: MonthBucket[]): string | null =>
  monthKey !== null && buckets.some((bucket) => bucket.key === monthKey && bucket.count > 0) ? monthKey : null

/**
 * Whether the rows are shown: with results, and while a newer search runs over earlier rows.
 *
 * @param {ScenePanelStatusKind} status - Panel status.
 * @param {number} count - Rows to show.
 * @returns {boolean} True when the list is shown.
 */
const isListShown = (status: ScenePanelStatusKind, count: number): boolean =>
  status === 'results' || (status === 'searching' && count > 0)

/**
 * Toggles the selected scene: clicking the selected row deselects it.
 *
 * @param {string|null} currentId - Selected scene id.
 * @param {string} sceneId - Clicked scene id.
 * @returns {string|null} New selected id.
 */
const toggleSelectedId = (currentId: string | null, sceneId: string): string | null =>
  currentId === sceneId ? null : sceneId

type ScenesMessageProps = { message: ScenePanelMessage; showRetry: boolean; onRetry: () => void }

/**
 * Status message of the panel, with Retry after an index error.
 *
 * @param {object} props - Props.
 * @param {ScenePanelMessage} props.message - Message key and params.
 * @param {boolean} props.showRetry - Whether to show Retry.
 * @param {Function} props.onRetry - Retries the search.
 * @returns {React.ReactElement} The message.
 */
const ScenesMessage = ({ message, showRetry, onRetry }: ScenesMessageProps): React.ReactElement => {
  const t = useI18nT()
  return (
    <div className="scenes-panel__message" role="status">
      <span data-testid={TestId.mapWorkspace.scenesMessage}>{t(message.key, message.params)}</span>
      {showRetry && (
        <Button size="small" onClick={onRetry} data-testid={TestId.mapWorkspace.scenesRetry}>
          {t('mapWorkspace.scenes.messages.retry')}
        </Button>
      )}
    </div>
  )
}

/**
 * The Sentinel-2 rail panel: area, period and filters, the month chart, the scenes and their layer actions.
 *
 * @returns {React.ReactElement} The panel.
 */
export const ScenesPanel = (): React.ReactElement => {
  const map = useMap()
  const t = useI18nT()
  // the rail keeps hidden panels mounted: a hidden panel keeps its choices but searches and draws nothing
  const active = useMapWorkspace().railTab === 'scenes'
  const [periodMonths, setPeriodMonths] = useState<ScenePeriodMonths>(DEFAULT_SCENE_PERIOD_MONTHS)
  const [filters, setFilters] = useState<SceneFilters>(DEFAULT_SCENE_FILTERS)
  const [monthKey, setMonthKey] = useState<string | null>(null)
  const [sort, setSort] = useState<SceneSort>('newest')
  const [bandMix, setBandMix] = useState<SceneBandMix>('trueColour')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const area = useSceneArea(map, active)
  // the period ends now and stays fixed until the user picks another length
  const period = useMemo(() => getScenePeriod(periodMonths, new Date()), [periodMonths])
  const tilesResult = useMemo(() => (area.bounds ? getMgrsTilesForBounds(area.bounds) : null), [area.bounds])
  const tilesKey = getTilesKey(tilesResult)
  const tiles = useMemo(() => (active && tilesKey ? tilesKey.split(',') : NO_TILES), [active, tilesKey])
  const search = useSceneSearch({ tiles, period })
  const { pendingIds, addSceneLayer } = useSceneLayers(map)

  const filtered = useMemo(() => filterScenes(search.scenes, filters), [filters, search.scenes])
  const buckets = useMemo(() => getMonthHistogram(filtered, period), [filtered, period])
  const activeMonthKey = getActiveMonthKey(monthKey, buckets)
  const shown = useMemo(
    () => sortScenes(filterScenesByMonth(filtered, activeMonthKey), sort),
    [activeMonthKey, filtered, sort]
  )
  const selected: SceneResult | undefined = shown.find((scene) => scene.id === selectedId)
  const footprintTile = active && selected ? selected.tile : null
  useSceneFootprint(map, footprintTile)

  const status = getScenePanelStatus({
    areaKey: area.areaKey,
    hasBounds: area.bounds !== null,
    drawing: area.drawing,
    tilesStatus: tilesResult?.status ?? null,
    loading: search.loading,
    failed: search.failed,
    resultCount: filtered.length,
  })
  const message = getScenePanelMessage(status, tiles.length)

  return (
    <div className="scenes-panel" data-testid={TestId.mapWorkspace.scenesPanel}>
      <p className="scenes-panel__intro">{t('mapWorkspace.scenes.intro')}</p>
      <ScenesAreaControl
        areaKey={area.areaKey}
        plotAvailable={area.plotAvailable}
        showDrawAgain={area.areaKey === 'draw' && area.hasDrawnArea && !area.drawing}
        onChange={area.selectArea}
        onDrawAgain={area.startDrawing}
      />
      <ScenesPeriodControl months={periodMonths} period={period} onChange={setPeriodMonths} />
      <ScenesPercentSlider
        sliderKey="maxCloud"
        value={filters.maxCloud}
        onChange={(maxCloud) => setFilters((current) => ({ ...current, maxCloud }))}
      />
      <ScenesPercentSlider
        sliderKey="minCoverage"
        value={filters.minCoverage}
        onChange={(minCoverage) => setFilters((current) => ({ ...current, minCoverage }))}
      />
      {message && <ScenesMessage message={message} showRetry={status === 'error'} onRetry={search.retry} />}
      {CHART_STATUSES.has(status) && (
        <ScenesMonthChart buckets={buckets} activeMonthKey={activeMonthKey} onSelectMonth={setMonthKey} />
      )}
      {isListShown(status, shown.length) && (
        <ScenesResults
          scenes={shown}
          monthKey={activeMonthKey}
          selectedId={selectedId}
          sort={sort}
          stale={status === 'searching'}
          onSortChange={setSort}
          bandMix={bandMix}
          pendingIds={pendingIds}
          onSelect={(sceneId) => setSelectedId((current) => toggleSelectedId(current, sceneId))}
          onAddLayer={(scene, asBase) => addSceneLayer({ scene, bandMix, asBase })}
        />
      )}
      <ScenesBandsControl bandMix={bandMix} onChange={setBandMix} />
    </div>
  )
}
