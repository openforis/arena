import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { useMap } from 'react-leaflet'

import { useI18nT } from '@webapp/store/system'
import { useMapWorkspace } from '@webapp/components/MapContainer/workspace/MapWorkspaceContext'
import { isolateFromMap } from '@webapp/components/MapContainer/workspace/tools/measure/geomanMeasure'
import { MeasureBar } from '@webapp/components/MapContainer/workspace/tools/measure/MeasureBar'
import { formatMeasureTexts } from '@webapp/components/MapContainer/workspace/tools/measure/measureFormat'
import { toolOfMeasureMode, unitOptionsOf } from '@webapp/components/MapContainer/workspace/tools/measure/measureModes'
import {
  getMeasureSummary,
  initialMeasureState,
  measureReducer,
} from '@webapp/components/MapContainer/workspace/tools/measure/measureState'
import type {
  MeasureAreaUnit,
  MeasureDistanceUnit,
  MeasureMode,
  MeasureUnit,
  MeasureUnitOption,
} from '@webapp/components/MapContainer/workspace/tools/measure/measureTypes'
import { useGeomanMeasure } from '@webapp/components/MapContainer/workspace/tools/measure/useGeomanMeasure'

export type MeasureToolProps = { mode: MeasureMode }

/**
 * Measure tool: Geoman drawing on the map and the floating measure bar, rendered inside the map container.
 * @param {object} props - The component props.
 * @param {MeasureMode} props.mode - Distance (line) or area (polygon).
 * @returns {React.ReactElement} The measure bar portal.
 */
export const MeasureTool = ({ mode }: MeasureToolProps): ReactElement => {
  const map = useMap()
  const t = useI18nT()
  const { dispatch: dispatchWorkspace, variant } = useMapWorkspace()
  const [state, dispatch] = useReducer(measureReducer, initialMeasureState)
  const [distanceUnit, setDistanceUnit] = useState<MeasureDistanceUnit>('auto')
  const [areaUnit, setAreaUnit] = useState<MeasureAreaUnit>('auto')
  const barRef = useRef<HTMLDivElement | null>(null)

  /**
   * Keeps the bar element and isolates it from the map mouse events.
   * @param {HTMLDivElement|null} element - The bar element, null on unmount.
   * @returns {void}
   */
  const setBarElement = useCallback((element: HTMLDivElement | null): void => {
    barRef.current = element
    if (element) isolateFromMap(element)
  }, [])

  const finishedLayer = useGeomanMeasure({ map, mode, dispatch, barRef })

  /**
   * Translates the symbol of a unit.
   * @param {MeasureUnit} unit - The unit.
   * @returns {string} The localized symbol.
   */
  const unitLabel = useCallback((unit: MeasureUnit): string => t(`mapWorkspace.measure.unitSymbols.${unit}`), [t])
  const summary = getMeasureSummary(mode, state)
  const { total, perimeter } = formatMeasureTexts({ mode, summary, distanceUnit, areaUnit, unitLabel })

  useEffect(
    /**
     * Mirrors the running total in the tooltip of the finished layer.
     * @returns {void}
     */
    () => {
      if (finishedLayer && total) finishedLayer.setTooltipContent(total)
    },
    [finishedLayer, total]
  )

  // Done or Escape on a bar control unmounts the focused control with the bar and the focus falls to the body,
  // outside the workspace root: give it back to the map so Escape keeps ending the tool
  useEffect(
    /**
     * Registers the cleanup that returns the focus to the map container.
     * @returns {Function} The cleanup, run when the tool unmounts.
     */
    () => () => {
      const { activeElement } = document
      if (!activeElement || activeElement === document.body) map.getContainer().focus({ preventScroll: true })
    },
    [map]
  )

  /**
   * Switches to the tool of the selected mode.
   * @param {MeasureMode} nextMode - The selected mode.
   * @returns {void}
   */
  const onModeChange = useCallback(
    (nextMode: MeasureMode): void => dispatchWorkspace({ type: 'startTool', tool: toolOfMeasureMode(nextMode) }),
    [dispatchWorkspace]
  )

  /**
   * Stores the chosen unit of the active mode.
   * @param {MeasureUnitOption} unit - The chosen unit.
   * @returns {void}
   */
  const onUnitChange = useCallback(
    (unit: MeasureUnitOption): void => {
      if (mode === 'distance') {
        setDistanceUnit(unit as MeasureDistanceUnit)
      } else {
        setAreaUnit(unit as MeasureAreaUnit)
      }
    },
    [mode]
  )

  /**
   * Ends the tool.
   * @returns {void}
   */
  const onDone = useCallback((): void => dispatchWorkspace({ type: 'endTool' }), [dispatchWorkspace])

  return createPortal(
    <MeasureBar
      barRef={setBarElement}
      mode={mode}
      unit={mode === 'distance' ? distanceUnit : areaUnit}
      unitOptions={unitOptionsOf(mode)}
      total={total}
      perimeter={perimeter}
      showHint={variant === 'full'}
      onModeChange={onModeChange}
      onUnitChange={onUnitChange}
      onDone={onDone}
    />,
    map.getContainer()
  )
}
