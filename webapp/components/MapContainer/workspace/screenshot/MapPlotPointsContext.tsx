import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { useSurvey, useSurveyPreferredLang } from '@webapp/store/survey'

import type {
  MapPlotPoint,
  MapPlotPointsLayer,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotPlotCandidates'

type MapPlotPointsRegistry = {
  registerLayer: (layer: MapPlotPointsLayer) => void
  unregisterLayer: (layerKey: string) => void
}

/**
 * Does nothing: the registry used outside a provider (maps without plot records).
 * @returns {void}
 */
const ignore = (): void => undefined

// split in two contexts: the layers re-render on registration, the registry callbacks stay stable
const RegistryContext = createContext<MapPlotPointsRegistry>({ registerLayer: ignore, unregisterLayer: ignore })
const LayersContext = createContext<MapPlotPointsLayer[]>([])

/**
 * Collects the points of the location layers shown in Data › Map, for the screenshot plot picker.
 * @param {object} props - The props.
 * @param {ReactNode} props.children - The map view.
 * @returns {React.ReactElement} The provider.
 */
export const MapPlotPointsProvider = ({ children }: { children: ReactNode }): React.ReactElement => {
  const [layersByKey, setLayersByKey] = useState<Record<string, MapPlotPointsLayer>>({})

  const registerLayer = useCallback(
    (layer: MapPlotPointsLayer) => setLayersByKey((previous) => ({ ...previous, [layer.layerKey]: layer })),
    []
  )
  const unregisterLayer = useCallback(
    (layerKey: string) =>
      setLayersByKey((previous) =>
        layerKey in previous
          ? Object.fromEntries(Object.entries(previous).filter(([key]) => key !== layerKey))
          : previous
      ),
    []
  )

  const registry = useMemo(() => ({ registerLayer, unregisterLayer }), [registerLayer, unregisterLayer])
  const layers = useMemo(() => Object.values(layersByKey), [layersByKey])

  return (
    <RegistryContext.Provider value={registry}>
      <LayersContext.Provider value={layers}>{children}</LayersContext.Provider>
    </RegistryContext.Provider>
  )
}

/**
 * Returns the registered location layers (empty outside a provider).
 * @returns {Array<MapPlotPointsLayer>} The layers with their points.
 */
export const useMapPlotPointsLayers = (): MapPlotPointsLayer[] => useContext(LayersContext)

/**
 * Registers the points of a location layer while it has points (they load only when the layer is shown).
 * @param {object} params - The parameters.
 * @param {string} params.layerKey - Layer key (the location attribute uuid).
 * @param {object} params.attributeDef - The location attribute definition.
 * @param {Array<MapPlotPoint>} params.points - The points of the layer.
 * @returns {void}
 */
export const useRegisterMapPlotPoints = ({
  layerKey,
  attributeDef,
  points,
}: {
  layerKey: string
  attributeDef: any
  points: MapPlotPoint[]
}): void => {
  const { registerLayer, unregisterLayer } = useContext(RegistryContext)
  const survey = useSurvey()
  const lang = useSurveyPreferredLang()
  const entityDef = useMemo(() => Survey.getNodeDefAncestorMultipleEntity(attributeDef)(survey), [attributeDef, survey])

  useEffect(() => {
    if (entityDef && points?.length > 0) {
      registerLayer({
        layerKey,
        entityDefUuid: NodeDef.getUuid(entityDef),
        entityName: NodeDef.getName(entityDef),
        entityLabel: NodeDef.getLabel(entityDef, lang),
        points,
      })
    } else {
      unregisterLayer(layerKey)
    }
  }, [entityDef, lang, layerKey, points, registerLayer, unregisterLayer])

  useEffect(() => () => unregisterLayer(layerKey), [layerKey, unregisterLayer])
}
