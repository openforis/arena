import { z } from 'zod'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { Authorizer } from '@openforis/arena-core'

import { isToolErrorOutput } from '@webapp/ai/conversations/dataClass'
import { findNodeDefByName, getCurrentNodeDefs } from '@webapp/ai/tools/common/nodeDefLookup'
import { canViewCurrentSurvey } from '@webapp/ai/tools/common/toolPermissions'
import type { AiTool, AiToolContext } from '@webapp/ai/tools/types'
import { parseMapSearchQuery } from '@core/geo/coordinateQuery'

export const MAP_PROPOSE_LAYER_TOOL_NAME = 'map_proposeLayer'

const MAX_LAYERS = 50

export const proposeMapLayerInputSchema = z.object({
  attribute: z.string().max(100).nullish().describe('Name of the coordinate or geo attribute to show as a map layer'),
  search: z
    .string()
    .max(100)
    .nullish()
    .describe(
      'One record to show: its key values as the user or an earlier answer named them (e.g. "EP" or "3 - EP"); or a place as coordinates ("41.9, 12.5", DMS or UTM). Omit to show the whole layer'
    ),
  explanation: z.string().max(1000).describe("Short explanation, in the user's language"),
})

export type ProposeMapLayerInput = z.infer<typeof proposeMapLayerInputSchema>

export type ProposedMapLayer = {
  attributeUuid: string | null
  attribute: string | null
  search: string | null
  explanation: string
  shownToUser: true
}

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
  const { attributeUuid, attribute, search, explanation, shownToUser } = output as any
  if (shownToUser !== true || (typeof attributeUuid !== 'string' && typeof search !== 'string')) return null
  // old outputs (restored conversations) have no search
  return {
    attributeUuid: typeof attributeUuid === 'string' ? attributeUuid : null,
    attribute: typeof attribute === 'string' ? attribute : null,
    search: typeof search === 'string' ? search : null,
    explanation,
    shownToUser: true,
  }
}

/**
 * Builds the invalid proposal error.
 * @param {string} message - What is wrong.
 * @param {any} survey - The survey.
 * @returns {object} The error output with the valid layer names.
 */
const invalidProposal = (message: string, survey: any) => ({
  error: {
    code: 'invalidProposal',
    message,
    layers: getCurrentNodeDefs(survey).filter(isMapLayerDef).map(NodeDef.getName).slice(0, MAX_LAYERS),
  },
})

/**
 * Validates the proposal.
 * @param {ProposeMapLayerInput} input - Tool input.
 * @param {any} survey - The survey.
 * @returns {object} The error output, or the layer node definition (null when only coordinates are given).
 */
const validate = (input: ProposeMapLayerInput, survey: any): { error: object } | { nodeDef: any } => {
  const { attribute, search } = input
  const searchType = search ? parseMapSearchQuery(search).type : null
  if (searchType === 'invalidCoordinates') {
    return invalidProposal(`"${search}" is not valid coordinates (latitude -90..90, longitude -180..180).`, survey)
  }
  if (attribute) {
    const nodeDef = findNodeDefByName(survey, attribute)
    return nodeDef && isMapLayerDef(nodeDef)
      ? { nodeDef }
      : invalidProposal(`"${attribute}" is not a coordinate or geo attribute: propose one of the valid layers.`, survey)
  }
  return searchType === 'coordinates'
    ? { nodeDef: null }
    : invalidProposal('Give the attribute of the layer to search the record in (or coordinates as search).', survey)
}

/**
 * Validates the proposed layer and shows it to the user as a card.
 * @param {ProposeMapLayerInput} input - Tool input.
 * @param {AiToolContext} ctx - Tool context.
 * @returns {Promise<object>} The layer, or the valid layer names.
 */
const execute = async (input: ProposeMapLayerInput, ctx: AiToolContext) => {
  const survey = ctx.getSurvey?.() ?? ctx.survey
  const validated = validate(input, survey)
  if ('error' in validated) return validated
  const { nodeDef } = validated
  return {
    attributeUuid: nodeDef ? NodeDef.getUuid(nodeDef) : null,
    attribute: nodeDef ? input.attribute : null,
    search: input.search ?? null,
    explanation: input.explanation,
    shownToUser: true,
  }
}

export const proposeMapLayerTool: AiTool<ProposeMapLayerInput, unknown> = {
  name: MAP_PROPOSE_LAYER_TOOL_NAME,
  description:
    'Proposes showing a coordinate or geo attribute as a layer on the Arena map (Data › Map). The user sees a card ' +
    'with "Show on map". ' +
    'The layer shows every record with a value; it cannot be filtered. If the user asks for a subset, say so and offer a query for the subset. ' +
    'To show one record pass its key values as search, with the attribute; to show a place given as coordinates pass them as search (the attribute is then optional). Coordinates win when the text reads as both. ' +
    'Returns the layer or the valid layer names.',
  inputSchema: proposeMapLayerInputSchema,
  area: ['analysis'],
  dataClass: 'schema',
  requires: (ctx: AiToolContext) =>
    canViewCurrentSurvey(ctx) && Authorizer.canUseMap(ctx.user, Survey.getSurveyInfo(ctx.survey)),
  execute,
}
