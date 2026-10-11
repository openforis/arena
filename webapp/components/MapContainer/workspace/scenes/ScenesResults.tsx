import React from 'react'
import Button from '@mui/material/Button'
import classNames from 'classnames'

import { useI18nT, useLang } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { SCENE_SORTS } from './sceneFilters'
import { getSceneOverlayId } from './sceneLayerInfo'
import { formatMonthLabel, formatSceneDate } from './scenePeriod'
import type { SceneBandMix, SceneResult, SceneSort } from './sceneTypes'
import { getSceneCogUrls, getSceneDirectoryUrl } from './sceneUrls'

type SceneRowProps = {
  scene: SceneResult
  selected: boolean
  bandMix: SceneBandMix
  pendingIds: ReadonlySet<string>
  onSelect: (sceneId: string) => void
  onAddLayer: (scene: SceneResult, asBase: boolean) => void
}

/**
 * One scene: thumbnail, date, tile, cloud and coverage; the selected row shows its layer actions.
 *
 * @param {object} props - Props.
 * @param {SceneResult} props.scene - Scene.
 * @param {boolean} props.selected - Whether the row is selected.
 * @param {SceneBandMix} props.bandMix - Band mix of new layers.
 * @param {ReadonlySet<string>} props.pendingIds - Overlay ids being loaded.
 * @param {Function} props.onSelect - Selects or deselects the row.
 * @param {Function} props.onAddLayer - Adds the scene as overlay or base map.
 * @returns {React.ReactElement} The row.
 */
const SceneRow = ({
  scene,
  selected,
  bandMix,
  pendingIds,
  onSelect,
  onAddLayer,
}: SceneRowProps): React.ReactElement => {
  const t = useI18nT()
  const lang = useLang()
  const date = formatSceneDate(scene.datetime, lang)
  const directoryUrl = getSceneDirectoryUrl(scene.thumbnailUrl)
  const canDisplay = getSceneCogUrls(scene.thumbnailUrl, bandMix) !== null
  const layerPending = pendingIds.has(getSceneOverlayId(scene.id, bandMix, false))
  const basePending = pendingIds.has(getSceneOverlayId(scene.id, bandMix, true))
  /**
   * Formats a percentage or the unknown mark.
   *
   * @param {number|null} value - Percentage.
   * @returns {string} Text.
   */
  const formatPercent = (value: number | null): string =>
    value === null
      ? t('mapWorkspace.scenes.unknownValue')
      : t('mapWorkspace.scenes.percent', { value: Math.round(value) })

  return (
    <li
      className={classNames('scenes-panel__row', { 'scenes-panel__row--selected': selected })}
      data-testid={TestId.mapWorkspace.sceneRow(scene.id)}
    >
      <button
        type="button"
        className="scenes-panel__row-button"
        aria-pressed={selected}
        onClick={() => onSelect(scene.id)}
      >
        {directoryUrl ? (
          <img
            className="scenes-panel__thumbnail"
            src={`${directoryUrl}L2A_PVI.jpg`}
            alt={t('mapWorkspace.scenes.thumbnailAlt', { date })}
            loading="lazy"
            width={44}
            height={44}
          />
        ) : (
          <span className="scenes-panel__thumbnail" />
        )}
        <span className="scenes-panel__row-text">
          <span className="scenes-panel__row-date">{date}</span>
          <span className="scenes-panel__row-details">
            {t('mapWorkspace.scenes.rowDetails', {
              tile: scene.tile,
              cloud: formatPercent(scene.cloud),
              coverage: formatPercent(scene.coverage),
            })}
          </span>
        </span>
      </button>
      {selected && (
        <div className="scenes-panel__row-actions">
          <Button
            size="small"
            variant="outlined"
            disabled={!canDisplay || layerPending}
            onClick={() => onAddLayer(scene, false)}
            data-testid={TestId.mapWorkspace.sceneAddLayer(scene.id)}
          >
            {t(layerPending ? 'mapWorkspace.scenes.loadingScene' : 'mapWorkspace.scenes.addAsLayer')}
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={!canDisplay || basePending}
            onClick={() => onAddLayer(scene, true)}
            data-testid={TestId.mapWorkspace.sceneUseAsBase(scene.id)}
          >
            {t(basePending ? 'mapWorkspace.scenes.loadingScene' : 'mapWorkspace.scenes.useAsBaseMap')}
          </Button>
        </div>
      )}
    </li>
  )
}

type ScenesResultsProps = Omit<SceneRowProps, 'scene' | 'selected'> & {
  scenes: SceneResult[]
  monthKey: string | null
  selectedId: string | null
  sort: SceneSort
  stale: boolean
  onSortChange: (sort: SceneSort) => void
}

/**
 * Scene count, sort select and the scene rows.
 *
 * @param {object} props - Props.
 * @param {SceneResult[]} props.scenes - Scenes to list (filtered and sorted).
 * @param {string|null} props.monthKey - Month filter, or null.
 * @param {string|null} props.selectedId - Selected scene id.
 * @param {SceneSort} props.sort - Sort.
 * @param {boolean} props.stale - Whether a newer search is running.
 * @param {Function} props.onSortChange - Called with the new sort.
 * @returns {React.ReactElement} The results.
 */
export const ScenesResults = ({
  scenes,
  monthKey,
  selectedId,
  sort,
  stale,
  onSortChange,
  ...rowProps
}: ScenesResultsProps): React.ReactElement => {
  const t = useI18nT()
  const lang = useLang()
  const count = scenes.length
  const countText = monthKey
    ? t('mapWorkspace.scenes.countInMonth', { count, month: formatMonthLabel(monthKey, lang, true) })
    : t('mapWorkspace.scenes.count', { count })

  return (
    <div className={classNames('scenes-panel__results', { 'scenes-panel__results--stale': stale })}>
      <div className="scenes-panel__label-row">
        <span className="scenes-panel__count" data-testid={TestId.mapWorkspace.scenesCount}>
          {countText}
        </span>
        <label className="scenes-panel__sort">
          <span>{t('mapWorkspace.scenes.sort.label')}</span>
          <select
            className="scenes-panel__select"
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SceneSort)}
            data-testid={TestId.mapWorkspace.scenesSort}
          >
            {SCENE_SORTS.map((option) => (
              <option key={option} value={option}>
                {t(`mapWorkspace.scenes.sort.${option}`)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ul className="scenes-panel__rows">
        {scenes.map((scene) => (
          <SceneRow key={scene.id} scene={scene} selected={scene.id === selectedId} {...rowProps} />
        ))}
      </ul>
    </div>
  )
}
