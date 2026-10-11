import { useCallback, useMemo, useState } from 'react'
import type L from 'leaflet'

import { useSurvey, useSurveyCycleKey, useSurveyPreferredLang } from '@webapp/store/survey'

import { useMapContextBaseLayer } from '@webapp/components/MapContainer/MapContext'
import { useMapWorkspace } from '@webapp/components/MapContainer/workspace/MapWorkspaceContext'
import { useMapCustomOverlays } from '@webapp/components/MapContainer/workspace/layers/MapCustomOverlaysContext'
import { useMapPlotPointsLayers } from '@webapp/components/MapContainer/workspace/screenshot/MapPlotPointsContext'
import { getFitToPlotZoom } from '@webapp/components/MapContainer/workspace/screenshot/screenshotCaptureRules'
import {
  buildScreenshotFileName,
  formatIsoDate,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotFileName'
import {
  getImageAttributeDefs,
  toImageAttributeOptions,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotImageAttributes'
import { buildPlotCandidates } from '@webapp/components/MapContainer/workspace/screenshot/screenshotPlotCandidates'
import {
  collectAttributions,
  getBaseMapName,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotStamp'
import type {
  LatLngLiteral,
  ScreenshotImageAttributeOption,
  ScreenshotOptions,
  ScreenshotPlotCandidate,
  ScreenshotTarget,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'
import type { ScreenshotStamp } from '@webapp/components/MapContainer/workspace/screenshot/useScreenshotPreview'

export type ScreenshotDialogState = {
  map: L.Map | null
  candidates: ScreenshotPlotCandidate[]
  plot: ScreenshotPlotCandidate | null
  selectPlot: (key: string) => void
  options: ScreenshotOptions
  setOption: <K extends keyof ScreenshotOptions>(key: K, value: ScreenshotOptions[K]) => void
  target: ScreenshotTarget
  setTarget: (target: ScreenshotTarget) => void
  attributeOptions: ScreenshotImageAttributeOption[]
  attribute: ScreenshotImageAttributeOption | null
  selectAttribute: (uuid: string) => void
  fileName: string
  setFileName: (fileName: string) => void
  defaultFileName: string
  stamp: ScreenshotStamp
  fitZoom: number
}

const DEFAULT_OPTIONS: ScreenshotOptions = {
  capture: 'view',
  includeData: true,
  includeScale: true,
  includeStamp: true,
}

/**
 * Reads the map centre when the dialog opens (plots are sorted by distance from it).
 * @param {L.Map|null} map - The map.
 * @returns {LatLngLiteral|null} The centre.
 */
const readCenter = (map: L.Map | null): LatLngLiteral | null => {
  const center = map?.getCenter()
  return center ? { lat: center.lat, lng: center.lng } : null
}

/**
 * Holds the choices of the screenshot dialog and derives the plot list, the attribute options, the file name, the
 * stamp and the fit-to-plot zoom.
 * @returns {ScreenshotDialogState} The dialog state.
 */
export const useScreenshotDialogState = (): ScreenshotDialogState => {
  const { map } = useMapWorkspace()
  const survey = useSurvey()
  const cycle = useSurveyCycleKey()
  const lang = useSurveyPreferredLang()
  const plotLayers = useMapPlotPointsLayers()
  const { overlays } = useMapCustomOverlays()
  const baseLayer = useMapContextBaseLayer()

  const [openedAt] = useState(() => new Date())
  const [openCenter] = useState(() => readCenter(map))
  const [options, setOptions] = useState<ScreenshotOptions>(DEFAULT_OPTIONS)
  const [targetChoice, setTargetChoice] = useState<ScreenshotTarget | null>(null)
  const [plotKey, setPlotKey] = useState<string | null>(null)
  const [attributeUuid, setAttributeUuid] = useState<string | null>(null)
  const [fileNameInput, setFileNameInput] = useState<string | null>(null)

  const candidates = useMemo(
    () => buildPlotCandidates({ layers: plotLayers, center: openCenter }),
    [plotLayers, openCenter]
  )
  const plot = candidates.find((candidate) => candidate.key === plotKey) ?? candidates[0] ?? null
  const target: ScreenshotTarget = targetChoice ?? (candidates.length > 0 ? 'record' : 'file')
  const plotEntityDefUuid = plot?.entityDefUuid ?? null

  const attributeOptions = useMemo(
    () =>
      plotEntityDefUuid
        ? toImageAttributeOptions(getImageAttributeDefs({ survey, entityDefUuid: plotEntityDefUuid, cycle }), lang)
        : [],
    [cycle, lang, plotEntityDefUuid, survey]
  )
  const attribute = attributeOptions.find((option) => option.uuid === attributeUuid) ?? attributeOptions[0] ?? null

  const stampPlot = target === 'record' || options.capture === 'plot' ? plot : null
  const defaultFileName = useMemo(
    () => buildScreenshotFileName({ entityName: stampPlot?.entityName, keys: stampPlot?.keys, date: openedAt }),
    [openedAt, stampPlot]
  )
  const stamp = useMemo<ScreenshotStamp>(
    () => ({
      plotLabel: stampPlot?.label ?? null,
      plotPoint: stampPlot ? { lat: stampPlot.lat, lng: stampPlot.lng } : null,
      dateText: formatIsoDate(openedAt),
      baseMapName: getBaseMapName(baseLayer),
      attributions: collectAttributions({ baseLayerAttribution: baseLayer?.attribution, overlays }),
    }),
    [baseLayer, openedAt, overlays, stampPlot]
  )
  const fitZoom = useMemo(
    () => getFitToPlotZoom({ mapMaxZoom: map?.getMaxZoom(), baseLayerMaxZoom: baseLayer?.maxZoom }),
    [baseLayer, map]
  )

  const setOption = useCallback(
    <K extends keyof ScreenshotOptions>(key: K, value: ScreenshotOptions[K]) =>
      setOptions((previous) => ({ ...previous, [key]: value })),
    []
  )
  const selectPlot = useCallback((key: string) => {
    setPlotKey(key)
    setAttributeUuid(null)
    setFileNameInput(null)
  }, [])

  return {
    map,
    candidates,
    plot,
    selectPlot,
    options,
    setOption,
    target,
    setTarget: setTargetChoice,
    attributeOptions,
    attribute,
    selectAttribute: setAttributeUuid,
    fileName: fileNameInput ?? defaultFileName,
    setFileName: setFileNameInput,
    defaultFileName,
    stamp,
    fitZoom,
  }
}
