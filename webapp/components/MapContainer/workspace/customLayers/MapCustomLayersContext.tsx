import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import {
  canRemoveMapCustomLayer,
  type MapCustomLayer,
  type MapCustomLayerScope,
  type MapCustomLayerWithScope,
  mergeMapCustomLayers,
} from '@core/map/customLayers/mapCustomLayer'
import { useNotifyError, useNotifyInfo } from '@webapp/components/hooks'
import { exitFullScreen } from '@webapp/components/MapContainer/workspace/tools/useFullScreen'
import {
  type CustomBaseLayerDef,
  isCustomBaseLayerKey,
  toCustomBaseLayerDef,
} from '@webapp/components/MapContainer/workspace/customLayers/customLayerLeaflet'
import { useMapBaseLayerApi } from '@webapp/components/MapContainer/workspace/customLayers/useMapBaseLayerApi'
import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useAuthCanUseMap } from '@webapp/store/user/hooks'

type StoredLayers = { surveyLayers: MapCustomLayer[]; userLayers: MapCustomLayer[] }
type StoredEntry = { key: string; layers: StoredLayers }

export type MapCustomLayersContextValue = {
  layers: MapCustomLayerWithScope[]
  overlays: MapCustomLayerWithScope[]
  baseMaps: CustomBaseLayerDef[]
  canEditSurveyLayers: boolean
  retryFetch: () => void // loads the stored layers again (the dialog calls it when it opens after a failure)
  fetchFailed: boolean // shown in the WMS dialog too: notifications are hidden in full screen
  addLayers: (params: { scope: MapCustomLayerScope; layers: MapCustomLayer[] }) => Promise<void> // throws on failure
  removeLayer: (layer: MapCustomLayerWithScope) => Promise<void>
}

const emptyStoredLayers: StoredLayers = { surveyLayers: [], userLayers: [] }

const MapCustomLayersContext = createContext<MapCustomLayersContextValue>({
  layers: [],
  overlays: [],
  baseMaps: [],
  canEditSurveyLayers: false,
  fetchFailed: false,
  retryFetch: () => undefined,
  addLayers: async () => undefined,
  removeLayer: async () => undefined,
})

/**
 * Returns the stored-layers key of a scope.
 * @param {MapCustomLayerScope} scope - The scope.
 * @returns {string} surveyLayers or userLayers.
 */
const storedKeyOf = (scope: MapCustomLayerScope): keyof StoredLayers =>
  scope === 'survey' ? 'surveyLayers' : 'userLayers'

/**
 * Loads the custom layers of the current survey (survey and user scope) when the user can use the map. The layers are
 * kept with the survey they belong to, so another survey never sees them, without resetting state in an effect.
 * @returns {{surveyId: number, stored: StoredLayers, setStored: Function, loaded: boolean, fetchFailed: boolean,
 * retryFetch: Function}} The layers, their updater, whether they were loaded, whether loading them failed and a function to load them again.
 */
const useStoredMapCustomLayers = () => {
  const surveyId = useSurveyId()
  const canUseMap = useAuthCanUseMap()
  const notifyError = useNotifyError()
  const [entry, setEntry] = useState<StoredEntry | null>(null)
  const [failedKey, setFailedKey] = useState<string | null>(null)
  const [fetchAttempt, setFetchAttempt] = useState(0)
  const key = surveyId && canUseMap ? String(surveyId) : null

  useEffect(() => {
    if (!key) return undefined
    let cancelled = false
    API.fetchMapCustomLayers({ surveyId })
      .then((layers: StoredLayers) => {
        if (!cancelled) setEntry({ key, layers })
      })
      .catch(() => {
        if (cancelled) return
        setFailedKey(key)
        notifyError({ key: 'mapWorkspace.wms.errors.fetchLayersFailed' })
      })
    return () => {
      cancelled = true
    }
  }, [fetchAttempt, key, notifyError, surveyId])

  const loaded = key !== null && entry?.key === key
  const stored = loaded && entry ? entry.layers : emptyStoredLayers
  const setStored = useCallback(
    (update: (prev: StoredLayers) => StoredLayers) =>
      setEntry((prev) => (prev && prev.key === key ? { key, layers: update(prev.layers) } : prev)),
    [key]
  )
  const fetchFailed = !loaded && key !== null && failedKey === key
  const retryFetch = useCallback(() => setFetchAttempt((attempt) => attempt + 1), [])
  return { surveyId, stored, setStored, loaded, fetchFailed, retryFetch }
}

/**
 * Provides the custom WMS / WMTS / XYZ layers of the current survey to the map (base maps) and the workspace (overlays).
 * @param {object} props - Props.
 * @param {React.ReactNode} props.children - The children.
 * @returns {React.ReactElement} The provider.
 */
export const MapCustomLayersProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
  const canEditSurveyLayers = Boolean(useAuthCanEditSurvey())
  const notifyError = useNotifyError()
  const notifyInfo = useNotifyInfo()
  const { selectedBaseLayerKey, selectBaseLayer } = useMapBaseLayerApi()
  const { surveyId, stored, setStored, loaded, fetchFailed, retryFetch } = useStoredMapCustomLayers()
  // survey layers a user who cannot edit the survey removed: hidden until the map is reopened
  const [hiddenLayerIds, setHiddenLayerIds] = useState<string[]>([])

  const layers = useMemo(() => mergeMapCustomLayers({ ...stored, hiddenLayerIds }), [hiddenLayerIds, stored])
  const overlays = useMemo(() => layers.filter((layer) => layer.role === 'overlay'), [layers])
  const baseMaps = useMemo(() => layers.filter((layer) => layer.role === 'baseMap').map(toCustomBaseLayerDef), [layers])

  // a removed (or hidden) custom base map gives way to the default base layer
  useEffect(() => {
    if (!loaded || !isCustomBaseLayerKey(selectedBaseLayerKey)) return
    if (!baseMaps.some((def) => def.key === selectedBaseLayerKey)) selectBaseLayer(null)
  }, [baseMaps, loaded, selectBaseLayer, selectedBaseLayerKey])

  const addLayers = useCallback(
    async ({ scope, layers: newLayers }: { scope: MapCustomLayerScope; layers: MapCustomLayer[] }) => {
      const result = await API.addMapCustomLayers({ surveyId, scope, layers: newLayers })
      setStored((prev) => ({ ...prev, [storedKeyOf(scope)]: result }))
    },
    [setStored, surveyId]
  )

  const removeLayer = useCallback(
    async (layer: MapCustomLayerWithScope) => {
      if (!canRemoveMapCustomLayer({ scope: layer.scope, canEditSurvey: canEditSurveyLayers })) {
        setHiddenLayerIds((prev) => [...prev, layer.id])
        // the notice must be visible: app notifications render outside the full screen workspace
        exitFullScreen()
        notifyInfo({ key: 'mapWorkspace.wms.hiddenForSession' })
        return
      }
      try {
        const result = await API.deleteMapCustomLayer({ surveyId, scope: layer.scope, layerId: layer.id })
        setStored((prev) => ({ ...prev, [storedKeyOf(layer.scope)]: result }))
      } catch {
        // removed from the rail, maybe in full screen: app notifications render outside the workspace
        exitFullScreen()
        notifyError({ key: 'mapWorkspace.wms.errors.removeFailed' })
        // a new object makes the overlay registrar add the overlay back
        setStored((prev) => ({ ...prev }))
      }
    },
    [canEditSurveyLayers, notifyError, notifyInfo, setStored, surveyId]
  )

  const value = useMemo(
    () => ({ layers, overlays, baseMaps, canEditSurveyLayers, fetchFailed, retryFetch, addLayers, removeLayer }),
    [addLayers, baseMaps, canEditSurveyLayers, fetchFailed, layers, overlays, removeLayer, retryFetch]
  )

  return <MapCustomLayersContext.Provider value={value}>{children}</MapCustomLayersContext.Provider>
}

/**
 * Returns the custom layers of the current survey.
 * @returns {MapCustomLayersContextValue} The layers and the add / remove functions.
 */
export const useMapCustomLayers = (): MapCustomLayersContextValue => useContext(MapCustomLayersContext)
