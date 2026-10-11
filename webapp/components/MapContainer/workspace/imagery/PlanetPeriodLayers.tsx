// side effect: defines L.control.sideBySide and loads its CSS
import 'leaflet-side-by-side'

import React, { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import L from 'leaflet'
import { TileLayer, useMap } from 'react-leaflet'

import * as User from '@core/user/user'
import { useSurveyId } from '@webapp/store/survey'
import { useUser } from '@webapp/store/user'

import { baseLayerUrlByProviderFunction } from '../../baseLayers'
import { useMapContextBaseLayer } from '../../MapContext'
import { MAP_MAX_ZOOM, MAP_MIN_ZOOM } from '../../mapZoom'
import { useMapPlanetPeriod } from './MapPlanetPeriodContext'
import type { MapPeriod } from './planetPeriods'

type PeriodBaseLayer = { key: string; provider?: string }
type SideBySideControl = L.Control & {
  setLeftLayers: (layers: L.Layer | L.Layer[]) => void
  setRightLayers: (layers: L.Layer | L.Layer[]) => void
}
type SideBySideFactory = (left: L.Layer, right: L.Layer) => SideBySideControl
type PeriodUrlFunction = (params: { surveyId: number; period: MapPeriod; apiKey: string | null }) => string

/**
 * Finds the base tile layer of the map by its key.
 * @param {L.Map} map - The Leaflet map.
 * @param {string} key - The id of the tile layer.
 * @returns {L.TileLayer|null} The layer, or null when it is not on the map.
 */
const findBaseTileLayer = (map: L.Map, key: string): L.TileLayer | null => {
  let found: L.TileLayer | null = null
  map.eachLayer((layer) => {
    if (layer instanceof L.TileLayer && layer.options.id === key) found = layer
  })
  return found
}

/**
 * Builds the tile url of a Planet period.
 * @param {object} params - Parameters.
 * @param {PeriodUrlFunction|undefined} params.urlFunction - The provider function that builds the url.
 * @param {number} params.surveyId - The survey id.
 * @param {string|null} params.apiKey - The API key of the provider.
 * @param {MapPeriod|undefined} params.period - The period.
 * @param {boolean} params.falseColour - Whether to use the false colour processing.
 * @returns {string|null} The url, or null when there is no function or period.
 */
const buildPeriodUrl = ({
  urlFunction,
  surveyId,
  apiKey,
  period,
  falseColour,
}: {
  urlFunction: PeriodUrlFunction | undefined
  surveyId: number
  apiKey: string | null
  period: MapPeriod | undefined
  falseColour: boolean
}): string | null =>
  urlFunction && period ? `${urlFunction({ surveyId, period, apiKey })}&proc=${falseColour ? 'cir' : 'rgb'}` : null

/**
 * Shows the chosen Planet period on the base map and, when a second period is chosen, compares both side by side.
 * Render it inside the react-leaflet map (full workspace only).
 * @returns {React.ReactElement|null} The right-hand tile layer, if any.
 */
export const PlanetPeriodLayers = (): ReactElement | null => {
  const map = useMap()
  const user = useUser()
  const surveyId = useSurveyId() as number
  const { key: baseLayerKey, provider } = useMapContextBaseLayer() as PeriodBaseLayer
  const { available, periodByValue, leftValue, rightValue, falseColourLeft, falseColourRight } = useMapPlanetPeriod()
  const [rightLayer, setRightLayer] = useState<L.TileLayer | null>(null)

  const apiKey = provider ? (User.getMapApiKey({ provider })(user) ?? null) : null
  const urlFunction = provider ? (baseLayerUrlByProviderFunction[provider] as PeriodUrlFunction | undefined) : undefined

  const leftUrl = useMemo(
    () =>
      available
        ? buildPeriodUrl({
            urlFunction,
            surveyId,
            apiKey,
            period: periodByValue[leftValue],
            falseColour: falseColourLeft,
          })
        : null,
    [apiKey, available, falseColourLeft, leftValue, periodByValue, surveyId, urlFunction]
  )
  const rightUrl = useMemo(
    () =>
      available && rightValue !== null
        ? buildPeriodUrl({
            urlFunction,
            surveyId,
            apiKey,
            period: periodByValue[rightValue],
            falseColour: falseColourRight,
          })
        : null,
    [apiKey, available, falseColourRight, periodByValue, rightValue, surveyId, urlFunction]
  )

  // the base map tile layer (created by the layers control with id = base layer key) shows the left period
  useEffect(() => {
    if (!leftUrl) return
    findBaseTileLayer(map, baseLayerKey)?.setUrl(leftUrl)
  }, [baseLayerKey, leftUrl, map])

  useEffect(() => {
    const leftLayer = findBaseTileLayer(map, baseLayerKey)
    if (!leftLayer || !rightLayer) return undefined
    const createSideBySide = (L.control as unknown as { sideBySide: SideBySideFactory }).sideBySide
    const control = createSideBySide(leftLayer, rightLayer).addTo(map)
    return () => {
      // remove() resets the clip of both layers: forget a layer that already left the map
      control.setLeftLayers(map.hasLayer(leftLayer) ? leftLayer : [])
      control.setRightLayers(map.hasLayer(rightLayer) ? rightLayer : [])
      control.remove()
    }
  }, [baseLayerKey, map, rightLayer])

  if (!rightUrl) return null
  return <TileLayer ref={setRightLayer} id="right" url={rightUrl} maxZoom={MAP_MAX_ZOOM} minZoom={MAP_MIN_ZOOM} />
}
