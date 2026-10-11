import React from 'react'
import type { KeyboardEvent, ReactElement } from 'react'

import { useI18nT } from '@webapp/store/system'

import { useMapPlanetPeriod } from './MapPlanetPeriodContext'
import { formatPeriodLabel, getPeriodValue } from './planetPeriods'

/**
 * Keeps the keys typed in the selects inside them: MUI menu type-ahead and arrow keys must not take them (Escape and Tab still reach the menu, which closes).
 * @param {KeyboardEvent<HTMLDivElement>} event - The key event.
 * @returns {void}
 */
const keepKeysInSection = (event: KeyboardEvent<HTMLDivElement>): void => {
  if (event.key !== 'Escape' && event.key !== 'Tab') event.stopPropagation()
}

/**
 * Planet period controls inside the Imagery menu: shown period, period to compare with, false colour.
 * @returns {React.ReactElement} The section.
 */
export const PlanetPeriodSection = (): ReactElement => {
  const t = useI18nT()
  const {
    periods,
    leftValue,
    rightValue,
    falseColourLeft,
    falseColourRight,
    setLeftValue,
    setRightValue,
    toggleFalseColourLeft,
    toggleFalseColourRight,
  } = useMapPlanetPeriod()

  const periodOptions = periods.map((period) => {
    const value = getPeriodValue(period)
    return (
      <option key={value} value={value}>
        {formatPeriodLabel(period)}
      </option>
    )
  })

  return (
    <div className="map-planet-period" onKeyDown={keepKeysInSection}>
      <label className="map-planet-period__field">
        <span>{t('mapWorkspace.imagery.period')}</span>
        <select value={leftValue ?? ''} onChange={(event) => setLeftValue(Number(event.target.value))}>
          {periodOptions}
        </select>
      </label>
      <label className="map-planet-period__check">
        <input type="checkbox" checked={falseColourLeft} onChange={toggleFalseColourLeft} />
        {t('mapWorkspace.imagery.falseColour')}
      </label>
      <label className="map-planet-period__field">
        <span>{t('mapWorkspace.imagery.compareWith')}</span>
        <select
          value={rightValue ?? ''}
          onChange={(event) => setRightValue(event.target.value ? Number(event.target.value) : null)}
        >
          <option value="">{t('mapWorkspace.imagery.noComparison')}</option>
          {periodOptions}
        </select>
      </label>
      {rightValue !== null && (
        <label className="map-planet-period__check">
          <input type="checkbox" checked={falseColourRight} onChange={toggleFalseColourRight} />
          {t('mapWorkspace.imagery.falseColour')}
        </label>
      )}
    </div>
  )
}

// MUI MenuList: not a menu item (no highlight, not the initially focused child)
PlanetPeriodSection.muiSkipListHighlight = true
