import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { isMapLayerDef, type ProposedMapLayer } from '@webapp/ai/tools/analysis/proposeMapLayer'

export type MapLayerCardModel = {
  status: 'ok' | 'missing' | 'noPermission'
  label: string | null
  explanation: string
  uuid: string | null
  search: string | null
}

/**
 * Builds what the map layer card shows.
 * @param {object} params - Parameters.
 * @param {ProposedMapLayer} params.proposed - The proposed layer.
 * @param {string} params.lang - Label language.
 * @param {boolean} params.canUseMap - Whether the user can open the map.
 * @returns {MapLayerCardModel} The card model.
 */
export const getMapLayerCardModel = ({
  proposed,
  survey,
  lang,
  canUseMap,
}: {
  proposed: ProposedMapLayer
  survey: any
  lang: string
  canUseMap: boolean
}): MapLayerCardModel => {
  const { attributeUuid: uuid, explanation, search } = proposed
  const status = canUseMap ? 'ok' : 'noPermission'
  if (uuid === null) return { status, label: null, explanation, uuid, search }
  const nodeDef = Survey.getNodeDefByUuid(uuid)(survey)
  if (!nodeDef || !isMapLayerDef(nodeDef)) return { status: 'missing', label: null, explanation, uuid, search }
  return { status, label: NodeDef.getLabel(nodeDef, lang), explanation, uuid, search }
}
