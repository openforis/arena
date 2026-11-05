import React from 'react'
import Button from '@mui/material/Button'
import Slider from '@mui/material/Slider'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

import { useI18nT, useLang } from '@webapp/store/system'
import { TestId } from '@webapp/utils/testId'

import { SCENE_FILTER_STEP } from './sceneFilters'
import { SCENE_AREA_KEYS } from './scenePanelStatus'
import { formatPeriodRange, SCENE_PERIOD_OPTIONS } from './scenePeriod'
import type { SceneAreaKey, ScenePeriod, ScenePeriodMonths } from './sceneTypes'

type ScenesAreaControlProps = {
  areaKey: SceneAreaKey
  plotAvailable: boolean
  showDrawAgain: boolean
  onChange: (key: SceneAreaKey) => void
  onDrawAgain: () => void
}

/**
 * Area toggle: map view, selected plot or drawn rectangle.
 *
 * @param {object} props - Props.
 * @param {SceneAreaKey} props.areaKey - Selected area.
 * @param {boolean} props.plotAvailable - Whether a plot location is known.
 * @param {boolean} props.showDrawAgain - Whether to show the Draw again button.
 * @param {Function} props.onChange - Called with the new area.
 * @param {Function} props.onDrawAgain - Starts a new drawing.
 * @returns {React.ReactElement} The control.
 */
export const ScenesAreaControl = ({
  areaKey,
  plotAvailable,
  showDrawAgain,
  onChange,
  onDrawAgain,
}: ScenesAreaControlProps): React.ReactElement => {
  const t = useI18nT()
  return (
    <div className="scenes-panel__field">
      <span className="scenes-panel__label" id="scenes-panel-area-label">
        {t('mapWorkspace.scenes.area.label')}
      </span>
      <ToggleButtonGroup
        aria-labelledby="scenes-panel-area-label"
        exclusive
        fullWidth
        size="small"
        value={areaKey}
        onChange={(_event, value: SceneAreaKey | null) => {
          // exclusive groups send null when the selected button is clicked again
          if (value) onChange(value)
        }}
      >
        {SCENE_AREA_KEYS.map((key) => (
          <ToggleButton
            key={key}
            value={key}
            disabled={key === 'plot' && !plotAvailable}
            data-testid={TestId.mapWorkspace.scenesArea(key)}
          >
            {t(`mapWorkspace.scenes.area.${key}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {showDrawAgain && (
        <Button
          className="scenes-panel__draw-again"
          size="small"
          onClick={onDrawAgain}
          data-testid={TestId.mapWorkspace.scenesDrawAgain}
        >
          {t('mapWorkspace.scenes.area.drawAgain')}
        </Button>
      )}
    </div>
  )
}

type ScenesPeriodControlProps = {
  months: ScenePeriodMonths
  period: ScenePeriod
  onChange: (months: ScenePeriodMonths) => void
}

/**
 * Period toggle (1, 3 or 6 months back) with the resulting date range.
 *
 * @param {object} props - Props.
 * @param {ScenePeriodMonths} props.months - Selected number of months.
 * @param {ScenePeriod} props.period - Resulting period.
 * @param {Function} props.onChange - Called with the new number of months.
 * @returns {React.ReactElement} The control.
 */
export const ScenesPeriodControl = ({ months, period, onChange }: ScenesPeriodControlProps): React.ReactElement => {
  const t = useI18nT()
  const lang = useLang()
  return (
    <div className="scenes-panel__field">
      <div className="scenes-panel__label-row">
        <span className="scenes-panel__label" id="scenes-panel-period-label">
          {t('mapWorkspace.scenes.period.label')}
        </span>
        <span className="scenes-panel__hint">{t('mapWorkspace.scenes.period.hint')}</span>
      </div>
      <ToggleButtonGroup
        aria-labelledby="scenes-panel-period-label"
        exclusive
        fullWidth
        size="small"
        value={months}
        onChange={(_event, value: ScenePeriodMonths | null) => {
          if (value) onChange(value)
        }}
      >
        {SCENE_PERIOD_OPTIONS.map((option) => (
          <ToggleButton key={option} value={option} data-testid={TestId.mapWorkspace.scenesPeriod(option)}>
            {t('mapWorkspace.scenes.period.months', { count: option })}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <span className="scenes-panel__range" data-testid={TestId.mapWorkspace.scenesRange}>
        {formatPeriodRange(period, lang)}
      </span>
    </div>
  )
}

type ScenesPercentSliderProps = {
  sliderKey: 'maxCloud' | 'minCoverage'
  value: number
  onChange: (value: number) => void
}

const SLIDER_TEST_IDS: Record<ScenesPercentSliderProps['sliderKey'], string> = {
  maxCloud: TestId.mapWorkspace.scenesMaxCloud,
  minCoverage: TestId.mapWorkspace.scenesMinCoverage,
}

/**
 * Percent slider (0–100, step 5) for the max cloud and min coverage filters.
 *
 * @param {object} props - Props.
 * @param {string} props.sliderKey - 'maxCloud' or 'minCoverage'.
 * @param {number} props.value - Value in percent.
 * @param {Function} props.onChange - Called with the new value.
 * @returns {React.ReactElement} The slider.
 */
export const ScenesPercentSlider = ({ sliderKey, value, onChange }: ScenesPercentSliderProps): React.ReactElement => {
  const t = useI18nT()
  const label = t(`mapWorkspace.scenes.${sliderKey}`)
  return (
    <div className="scenes-panel__field">
      <div className="scenes-panel__label-row">
        <span className="scenes-panel__label">{label}</span>
        <span className="scenes-panel__value">{t('mapWorkspace.scenes.percent', { value })}</span>
      </div>
      <Slider
        aria-label={label}
        getAriaValueText={(sliderValue: number) => t('mapWorkspace.scenes.percent', { value: sliderValue })}
        max={100}
        min={0}
        size="small"
        step={SCENE_FILTER_STEP}
        value={value}
        onChange={(_event, next) => onChange(Array.isArray(next) ? next[0] : next)}
        data-testid={SLIDER_TEST_IDS[sliderKey]}
      />
    </div>
  )
}
