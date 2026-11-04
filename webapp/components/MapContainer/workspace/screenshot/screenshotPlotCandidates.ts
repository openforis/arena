import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import { toKeyText } from '@webapp/components/MapContainer/workspace/screenshot/screenshotFileName'

import type {
  ActiveLayer,
  MapLayerPoint,
} from '@webapp/views/App/views/Data/MapView/MapLayersPanel/MapLayersPanelContext'
import type {
  LatLngLiteral,
  ScreenshotPlotCandidate,
} from '@webapp/components/MapContainer/workspace/screenshot/screenshotTypes'

// the points of an active layer of Data › Map (the Records tab) that is a location attribute of a plot entity
export type PlotLayer = {
  entityDefUuid: string
  entityName: string
  entityLabel: string
  points: MapLayerPoint[]
}

/**
 * Keeps the active layers that are location attributes inside a multiple entity (the plot), with that entity.
 * @param {object} params - The parameters.
 * @param {Array<ActiveLayer>} params.activeLayers - The layers of the Records tab (their key is the attribute uuid).
 * @param {object} params.survey - The survey.
 * @param {string} params.lang - The language of the entity label.
 * @returns {Array<PlotLayer>} The plot layers; sampling point layers and layers outside an entity are dropped.
 */
export const toPlotLayers = ({
  activeLayers,
  survey,
  lang,
}: {
  activeLayers: ActiveLayer[]
  survey: any
  lang: string
}): PlotLayer[] => {
  const layers: PlotLayer[] = []
  for (const { key, points } of activeLayers) {
    const attributeDef = Survey.getNodeDefByUuid(key)(survey)
    const entityDef = attributeDef ? Survey.getNodeDefAncestorMultipleEntity(attributeDef)(survey) : null
    if (entityDef) {
      layers.push({
        entityDefUuid: NodeDef.getUuid(entityDef),
        entityName: NodeDef.getName(entityDef),
        entityLabel: NodeDef.getLabel(entityDef, lang),
        points,
      })
    }
  }
  return layers
}

/**
 * Turns the ancestor key values of a point into non-empty texts.
 * @param {Array<unknown>} [ancestorsKeys] - The key values.
 * @returns {Array<string>} The key texts.
 */
const toKeyTexts = (ancestorsKeys: unknown[] = []): string[] =>
  ancestorsKeys.map((key) => toKeyText(key).trim()).filter((key) => key.length > 0)

/**
 * Builds the plot candidate of a point, when the point is valid.
 * @param {PlotLayer} layer - The layer of the point.
 * @param {MapLayerPoint} point - The point.
 * @returns {ScreenshotPlotCandidate|null} The candidate, or null for a point without coordinates or record.
 */
const toCandidate = (layer: PlotLayer, point: MapLayerPoint): ScreenshotPlotCandidate | null => {
  const [lng, lat] = point?.geometry?.coordinates ?? []
  const { key, recordUuid, parentUuid, ancestorsKeys } = point?.properties ?? {}
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !key || !recordUuid || !parentUuid) return null
  const keys = toKeyTexts(ancestorsKeys)
  return {
    key,
    recordUuid,
    parentUuid,
    entityDefUuid: layer.entityDefUuid,
    entityName: layer.entityName,
    keys,
    label: [layer.entityLabel, keys.join(' - ')].filter((text) => text.length > 0).join(' '),
    lat,
    lng,
  }
}

/**
 * Computes a planar distance in degrees, with longitudes shrunk by the cosine of the latitude (fine for sorting).
 * @param {LatLngLiteral} a - First point.
 * @param {LatLngLiteral} b - Second point.
 * @returns {number} The distance.
 */
export const planarDistance = (a: LatLngLiteral, b: LatLngLiteral): number => {
  const meanLatRad = ((a.lat + b.lat) / 2) * (Math.PI / 180)
  return Math.hypot((a.lng - b.lng) * Math.cos(meanLatRad), a.lat - b.lat)
}

/**
 * Builds the plot list of the screenshot dialog from the points of the shown location layers.
 * @param {object} params - The parameters.
 * @param {Array<PlotLayer>} params.layers - The plot layers.
 * @param {LatLngLiteral|null} params.center - The map centre; null sorts by label.
 * @returns {Array<ScreenshotPlotCandidate>} One candidate per plot, nearest first.
 */
export const buildPlotCandidates = ({
  layers,
  center,
}: {
  layers: PlotLayer[]
  center: LatLngLiteral | null
}): ScreenshotPlotCandidate[] => {
  const byKey = new Map<string, ScreenshotPlotCandidate>()
  for (const layer of layers) {
    for (const point of layer.points) {
      const candidate = toCandidate(layer, point)
      if (candidate && !byKey.has(candidate.key)) byKey.set(candidate.key, candidate)
    }
  }
  const candidates = [...byKey.values()]
  if (!center) return candidates.sort((a, b) => a.label.localeCompare(b.label))
  return candidates
    .map((candidate) => ({ candidate, distance: planarDistance(candidate, center) }))
    .sort((a, b) => a.distance - b.distance || a.candidate.label.localeCompare(b.candidate.label))
    .map(({ candidate }) => candidate)
}
