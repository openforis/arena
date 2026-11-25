import type { MapRecordCandidate } from '@webapp/components/MapContainer/workspace/mapWorkspaceTypes'

import type { ActiveLayer } from './MapLayersPanel/MapLayersPanelContext'

const ID_SEPARATOR = '|'

/**
 * Builds the search candidates of the Data › Map records: one per point of every active layer.
 * @param {ActiveLayer[]} activeLayers - Layers registered in the Records panel.
 * @returns {MapRecordCandidate[]} The candidates; the id is "<layer key>|<point key>".
 */
export const buildRecordCandidates = (activeLayers: ActiveLayer[]): MapRecordCandidate[] => {
  const candidates: MapRecordCandidate[] = []
  for (const layer of activeLayers) {
    for (const point of layer.points) {
      const [lng, lat] = point.geometry.coordinates
      candidates.push({
        id: `${layer.key}${ID_SEPARATOR}${point.properties.key}`,
        label: point.properties.ancestorsKeys.join(' - '),
        lat,
        lng,
      })
    }
  }
  return candidates
}

/**
 * Selects the point of a search candidate in the Records panel and flies to it.
 * @param {object} params - Parameters.
 * @param {string} params.id - Candidate id ("<layer key>|<point key>").
 * @param {ActiveLayer[]} params.activeLayers - Layers registered in the Records panel.
 * @param {Function} params.selectPoint - Selects a point by key in the Records panel.
 * @returns {void}
 */
export const selectRecordCandidate = ({
  id,
  activeLayers,
  selectPoint,
}: {
  id: string
  activeLayers: ActiveLayer[]
  selectPoint: (key: string | null) => void
}): void => {
  const separatorIndex = id.indexOf(ID_SEPARATOR)
  if (separatorIndex < 0) return
  const layerKey = id.slice(0, separatorIndex)
  const pointKey = id.slice(separatorIndex + 1)
  const layer = activeLayers.find((activeLayer) => activeLayer.key === layerKey)
  const point = layer?.points.find((layerPoint) => layerPoint.properties.key === pointKey)
  if (!layer || !point) return
  // flying closes the open popup, which deselects its point: select afterwards
  layer.flyToPoint(point)
  selectPoint(pointKey)
}
