import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactElement, ReactNode } from 'react'

import * as API from '@webapp/service/api'

import { useMapContextBaseLayer } from '../../MapContext'
import { getPeriodValue, indexPeriodsByValue } from './planetPeriods'
import type { MapPeriod } from './planetPeriods'

type PeriodBaseLayer = { periodSelectorAvailable?: boolean; provider?: string; periodType?: string }

type PlanetPeriodState = {
  // base map the periods belong to (a stale state of another base map is ignored)
  sourceKey: string | null
  periods: MapPeriod[]
  periodByValue: Record<number, MapPeriod>
  leftValue: number | null
  rightValue: number | null
  falseColourLeft: boolean
  falseColourRight: boolean
}

export type MapPlanetPeriodContextValue = PlanetPeriodState & {
  available: boolean
  setLeftValue: (value: number) => void
  setRightValue: (value: number | null) => void
  toggleFalseColourLeft: () => void
  toggleFalseColourRight: () => void
}

const INITIAL_STATE: PlanetPeriodState = {
  sourceKey: null,
  periods: [],
  periodByValue: {},
  leftValue: null,
  rightValue: null,
  falseColourLeft: false,
  falseColourRight: false,
}

const MapPlanetPeriodContext = createContext<MapPlanetPeriodContextValue | null>(null)

/**
 * Keeps the Planet periods of the current base map (when it has periods): the shown period, the period compared side
 * by side, false colour.
 * @param {object} props - Component props.
 * @param {ReactNode} props.children - Map content.
 * @returns {React.ReactElement} The provider.
 */
export const MapPlanetPeriodProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const { periodSelectorAvailable, provider, periodType } = (useMapContextBaseLayer() ?? {}) as PeriodBaseLayer
  const [loadedState, setState] = useState<PlanetPeriodState>(INITIAL_STATE)
  const sourceKey = periodSelectorAvailable && provider ? `${provider}|${periodType ?? ''}` : null
  const state = loadedState.sourceKey === sourceKey ? loadedState : INITIAL_STATE

  useEffect(() => {
    if (!sourceKey || !provider) return undefined
    let cancelled = false
    const load = async (): Promise<void> => {
      try {
        const periods = ((await API.fetchAvailableMapPeriods({ provider, periodType })) ?? []) as MapPeriod[]
        if (cancelled) return
        const lastPeriod = periods.at(-1)
        setState({
          ...INITIAL_STATE,
          sourceKey,
          periods,
          periodByValue: indexPeriodsByValue(periods),
          leftValue: lastPeriod ? getPeriodValue(lastPeriod) : null,
        })
      } catch {
        // no periods: the Imagery menu stays hidden and the base map keeps its default period
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [periodType, provider, sourceKey])

  const setLeftValue = useCallback((value: number) => setState((prev) => ({ ...prev, leftValue: value })), [])
  const setRightValue = useCallback(
    (value: number | null) => setState((prev) => ({ ...prev, rightValue: value, falseColourRight: false })),
    []
  )
  const toggleFalseColourLeft = useCallback(
    () => setState((prev) => ({ ...prev, falseColourLeft: !prev.falseColourLeft })),
    []
  )
  const toggleFalseColourRight = useCallback(
    () => setState((prev) => ({ ...prev, falseColourRight: !prev.falseColourRight })),
    []
  )

  const available = sourceKey !== null && state.periods.length > 0

  const value = useMemo(
    () => ({ ...state, available, setLeftValue, setRightValue, toggleFalseColourLeft, toggleFalseColourRight }),
    [available, setLeftValue, setRightValue, state, toggleFalseColourLeft, toggleFalseColourRight]
  )

  return <MapPlanetPeriodContext.Provider value={value}>{children}</MapPlanetPeriodContext.Provider>
}

/**
 * Returns the Planet period state.
 * @returns {MapPlanetPeriodContextValue} State and setters.
 */
export const useMapPlanetPeriod = (): MapPlanetPeriodContextValue => {
  const context = useContext(MapPlanetPeriodContext)
  if (!context) throw new Error('useMapPlanetPeriod must be used inside MapPlanetPeriodProvider')
  return context
}
