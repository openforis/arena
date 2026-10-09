import { z } from 'zod'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { QueryNodeDefs } from '@common/model/query'

import type { AiTool } from '@webapp/ai/tools/types'

import { RESULT_MAX_CHARS, canViewCurrentSurvey, fitListToBudget, getAnalysisContext, toolError } from './toolResults'

const inputSchema = z.object({
  entity: z
    .string()
    .max(100)
    .nullish()
    .describe('Optional entity name: only that entity is returned (use it when attributes were omitted)'),
})

type Input = z.infer<typeof inputSchema>

type EntityParams = { survey: any; entityDef: any; cycle: string; lang: string; includeAnalysis: boolean }

/**
 * Describes an entity for the model: its name, label, parent and Explorer attributes.
 * @param {EntityParams} params - Parameters.
 * @returns {object} The entity item.
 */
const toEntityItem = ({ survey, entityDef, cycle, lang, includeAnalysis }: EntityParams) => {
  const params = { survey, entityDef, cycle, includeAnalysis }
  const dimensionUuids = new Set(QueryNodeDefs.getDimensionAttributeDefs(params).map(NodeDef.getUuid))
  const measureUuids = new Set(QueryNodeDefs.getMeasureAttributeDefs(params).map(NodeDef.getUuid))
  const parentDef = Survey.getNodeDefParent(entityDef)(survey)
  return {
    name: NodeDef.getName(entityDef),
    label: NodeDef.getLabel(entityDef, lang),
    parentEntity: parentDef ? NodeDef.getName(parentDef) : null,
    attributes: QueryNodeDefs.getRawAttributeDefs(params).map((nodeDef) => ({
      name: NodeDef.getName(nodeDef),
      label: NodeDef.getLabel(nodeDef, lang),
      type: NodeDef.getType(nodeDef),
      dimension: dimensionUuids.has(NodeDef.getUuid(nodeDef)),
      measure: measureUuids.has(NodeDef.getUuid(nodeDef)),
    })),
  }
}

/**
 * Lists the queryable entities and their attributes, or one entity.
 * @param {Input} input - Tool input.
 * @param {object} ctx - Tool context.
 * @returns {Promise<object>} The entities.
 */
const execute = async (input: Input, ctx: any) => {
  const { survey, cycle, lang, includeAnalysis } = getAnalysisContext(ctx)
  const entityDefs = QueryNodeDefs.getQueryableEntityDefs({ survey, cycle })
  const toItem = (entityDef: any) => toEntityItem({ survey, entityDef, cycle, lang, includeAnalysis })

  if (input.entity) {
    const entityDef = entityDefs.find((nodeDef: any) => NodeDef.getName(nodeDef) === input.entity)
    if (!entityDef) {
      return toolError('unknownEntity', `Unknown entity; valid entities: ${entityDefs.map(NodeDef.getName).join(', ')}`)
    }
    const item = toItem(entityDef)
    const attributes = fitListToBudget({ attributes: item.attributes }, 'attributes')
    return { entities: [{ ...item, attributes: attributes.attributes }], truncated: attributes.truncated ?? false }
  }

  const result = { entities: entityDefs.map(toItem) }
  if (JSON.stringify(result).length <= RESULT_MAX_CHARS) return result
  return {
    entities: result.entities.map(({ name, label, parentEntity }) => ({ name, label, parentEntity })),
    attributesOmitted: true,
    hint: 'Call query_listEntities again with "entity" to get the attributes of one entity.',
  }
}

export const listEntitiesTool: AiTool<Input, unknown> = {
  name: 'query_listEntities',
  description:
    'Lists the entities that can be queried and their attributes (name, label, type; "dimension" = can group by, ' +
    '"measure" = can be aggregated). An entity can also use the attributes of its ancestor entities.',
  inputSchema,
  area: ['analysis'],
  dataClass: 'schema',
  effect: 'read',
  requires: canViewCurrentSurvey,
  execute,
}
