import { z } from 'zod'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { Authorizer } from '@openforis/arena-core'

import { isToolErrorOutput } from '@webapp/ai/conversations/dataClass'
import { findNodeDefByName, getCurrentNodeDefs } from '@webapp/ai/tools/common/nodeDefLookup'
import { canViewCurrentSurvey } from '@webapp/ai/tools/common/toolPermissions'
import type { AiTool, AiToolContext } from '@webapp/ai/tools/types'

export const MAP_PROPOSE_LAYER_TOOL_NAME = 'map_proposeLayer'

const MAX_LAYERS = 50

export const proposeMapLayerInputSchema = z.object({
  attribute: z.string().max(100).describe('Name of the coordinate or geo attribute to show as a map layer'),
  explanation: z.string().max(1000).describe("Short explanation, in the user's language"),
})

export type ProposeMapLayerInput = z.infer<typeof proposeMapLayerInputSchema>

export type ProposedMapLayer = { attributeUuid: string; attribute: string; explanation: string; shownToUser: true }

/**
 * Returns true for the attributes that can be shown as a map layer.
 * @param {object} nodeDef - Node definition.
 * @returns {boolean} True for a coordinate or geo attribute.
 */
export const isMapLayerDef = (nodeDef: any): boolean => NodeDef.isCoordinate(nodeDef) || NodeDef.isGeo(nodeDef)

/**
 * Returns the proposed layer of a successful map_proposeLayer tool part, or null.
 * @param {object} part - Tool part.
 * @param {string} part.toolName - Tool name.
 * @param {unknown} part.output - Tool output.
 * @returns {ProposedMapLayer|null} The proposed layer.
 */
export const getProposedMapLayer = (part: { toolName: string; output: unknown }): ProposedMapLayer | null => {
  const { toolName, output } = part
  if (toolName !== MAP_PROPOSE_LAYER_TOOL_NAME || !output || typeof output !== 'object' || isToolErrorOutput(output))
    return null
  return typeof (output as any).attributeUuid === 'string' ? (output as ProposedMapLayer) : null
}

/**
 * Validates the proposed layer and shows it to the user as a card.
 * @param {ProposeMapLayerInput} input - Tool input.
 * @param {AiToolContext} ctx - Tool context.
 * @returns {Promise<object>} The layer, or the valid layer names.
 */
const execute = async (input: ProposeMapLayerInput, ctx: AiToolContext) => {
  const survey = ctx.getSurvey?.() ?? ctx.survey
  const nodeDef = findNodeDefByName(survey, input.attribute)
  if (nodeDef && isMapLayerDef(nodeDef)) {
    return {
      attributeUuid: NodeDef.getUuid(nodeDef),
      attribute: input.attribute,
      explanation: input.explanation,
      shownToUser: true,
    }
  }
  const layers = getCurrentNodeDefs(survey).filter(isMapLayerDef).map(NodeDef.getName).slice(0, MAX_LAYERS)
  return {
    error: {
      code: 'invalidProposal',
      message: `"${input.attribute}" is not a coordinate or geo attribute: propose one of the valid layers.`,
      layers,
    },
  }
}

export const proposeMapLayerTool: AiTool<ProposeMapLayerInput, unknown> = {
  name: MAP_PROPOSE_LAYER_TOOL_NAME,
  description:
    'Proposes showing a coordinate or geo attribute as a layer on the Arena map (Data › Map). The user sees a card ' +
    'with "Show on map". ' +
    'The layer shows every record with a value; it cannot be filtered. If the user asks for a subset, say so and offer a query for the subset. ' +
    'Returns the layer or the valid layer names.',
  inputSchema: proposeMapLayerInputSchema,
  area: ['analysis'],
  dataClass: 'schema',
  requires: (ctx: AiToolContext) =>
    canViewCurrentSurvey(ctx) && Authorizer.canUseMap(ctx.user, Survey.getSurveyInfo(ctx.survey)),
  execute,
}
