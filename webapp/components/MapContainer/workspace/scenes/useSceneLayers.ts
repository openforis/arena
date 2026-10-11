import { useCallback, useEffect, useRef, useState } from 'react'
import type L from 'leaflet'

import { useNotifyError } from '@webapp/components/hooks'
import { useMapCustomOverlays } from '@webapp/components/MapContainer/workspace/layers/MapCustomOverlaysContext'
import { useI18nT, useLang } from '@webapp/store/system'

import { getSceneAttribution, getSceneOverlayId, removeBaseSceneOverlays, setSceneLayerOpacity } from './sceneLayerInfo'
import { formatSceneDate } from './scenePeriod'
import type { SceneBandMix, SceneResult } from './sceneTypes'

export type AddSceneLayerParams = { scene: SceneResult; bandMix: SceneBandMix; asBase: boolean }

export type SceneLayersState = {
  pendingIds: ReadonlySet<string> // overlay ids whose COG headers are being read
  addSceneLayer: (params: AddSceneLayerParams) => void
}

// Plain text in the overlay registry: do not HTML-escape the interpolated values.
const PLAIN_TEXT = { interpolation: { escapeValue: false } }

/**
 * Adds scene layers (overlay or base map) to the overlay registry, so the Layers tab lists them.
 *
 * @param {L.Map} map - Map.
 * @returns {SceneLayersState} Pending ids and the add action.
 */
export const useSceneLayers = (map: L.Map): SceneLayersState => {
  const { overlays, addOverlay, removeOverlay } = useMapCustomOverlays()
  const notifyError = useNotifyError()
  const t = useI18nT()
  const lang = useLang()
  const overlaysRef = useRef(overlays)
  const pendingRef = useRef<Set<string>>(new Set())
  // id of the latest base request: it wins, so concurrent requests leave one base scene
  const latestBaseIdRef = useRef<string | null>(null)
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(() => new Set())

  useEffect(() => {
    overlaysRef.current = overlays
  }, [overlays])

  const setPending = useCallback((id: string, pending: boolean): void => {
    if (pending) pendingRef.current.add(id)
    else pendingRef.current.delete(id)
    setPendingIds(new Set(pendingRef.current))
  }, [])

  const loadSceneLayer = useCallback(
    async ({ scene, bandMix, asBase }: AddSceneLayerParams): Promise<void> => {
      const id = getSceneOverlayId(scene.id, bandMix, asBase)
      // Recorded before the pending check: re-clicking a pending base scene makes it the latest again.
      if (asBase) latestBaseIdRef.current = id
      if (overlaysRef.current.some((overlay) => overlay.id === id)) return
      if (pendingRef.current.has(id)) return
      const isSuperseded = (): boolean => asBase && latestBaseIdRef.current !== id
      setPending(id, true)
      try {
        const { createSceneLayer } = await import('./sceneLayer')
        const attribution = getSceneAttribution(scene.datetime)
        const layer = await createSceneLayer({ map, scene, bandMix, asBase, attribution })
        if (isSuperseded()) return // a newer base request replaced this one while it loaded
        if (asBase) removeBaseSceneOverlays(overlaysRef.current, removeOverlay)
        const name = t('mapWorkspace.scenes.layerName', {
          date: formatSceneDate(scene.datetime, lang),
          tile: scene.tile,
          bands: t(`mapWorkspace.scenes.bandsShort.${bandMix}`),
          ...PLAIN_TEXT,
        })
        addOverlay({
          id,
          group: 'scenes',
          name: asBase ? t('mapWorkspace.scenes.baseLayerName', { name, ...PLAIN_TEXT }) : name,
          layer,
          opacity: 1,
          attribution,
          setOpacity: setSceneLayerOpacity,
        })
      } catch {
        if (!isSuperseded()) notifyError({ key: 'mapWorkspace.scenes.messages.layerError' })
      } finally {
        setPending(id, false)
      }
    },
    [addOverlay, lang, map, notifyError, removeOverlay, setPending, t]
  )

  /**
   * Starts loading a scene layer; failures are reported by the loader.
   *
   * @param {AddSceneLayerParams} params - Scene, band mix and base map flag.
   * @returns {void}
   */
  const addSceneLayer = useCallback(
    (params: AddSceneLayerParams): void => {
      loadSceneLayer(params).catch(() => undefined)
    },
    [loadSceneLayer]
  )

  return { pendingIds, addSceneLayer }
}
