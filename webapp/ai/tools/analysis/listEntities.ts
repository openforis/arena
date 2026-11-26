import { z } from 'zod'

import { QueryNodeDefs } from '@common/model/query'
import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'
import { canViewCurrentSurvey } from '@webapp/ai/tools/common/toolPermissions'
import { fitListToBudget, getResultBudget } from '@webapp/ai/tools/common/toolResult'
import { AiToolFailure } from '@webapp/ai/tools/toolFailure'
import type { AiTool } from '@webapp/ai/tools/types'

import { getAnalysisContext } from './toolResults'

const inputSchema = z.object({
  entity: z
    .string()
    .max(100)
    .nullish()
    .describe('Optional entity name: only that entity is returned (use it when attributes were omitted)'),
  search: z
    .string()
    .max(100)
    .nullish()
    .describe('Optional text: only the attributes whose name or label contains it are returned, with their entity'),
})

type Input = z.infer<typeof inputSchema>

type EntityParams = { survey: any; entityDef: any; cycle: string; lang: string; includeAnalysis: boolean }

/**
 * Describes an entity for the model: its name, label, parent and Explorer attributes.
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
    // models count a child entity when asked for the number of records
    ...(parentDef ? {} : { oneRowPerRecord: true }),
    // a filter on the keys of the entity alone reads the rows of every record
    rowKeys: Survey.getNodeDefAncestorsKeyAttributes(entityDef, true)(survey).map(NodeDef.getName),
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
 * Finds the attributes whose name or label contains the text, in every entity.
 * @param {object} params - Parameters.
 * @param {object[]} params.entities - The entity items.
 * @param {string} params.search - The text.
 * @param {number} params.budget - Result size budget.
 * @returns {object} The attributes found, with a note when there is none.
 */
const searchAttributes = ({ entities, search, budget }: { entities: any[]; search: string; budget: number }) => {
  const text = search.trim().toLowerCase()
  const attributes = entities.flatMap((entity) =>
    entity.attributes
      .filter(({ name, label }) => `${name}\n${label ?? ''}`.toLowerCase().includes(text))
      .map((attribute: object) => ({ entity: entity.name, ...attribute }))
  )
  if (attributes.length > 0) return fitListToBudget({ search, attributes }, 'attributes', budget)
  return {
    search,
    attributes,
    // without it a model answers with the attribute that looks closest
    note:
      `No attribute name or label contains "${search}". Try one other word; when nothing matches, tell the user ` +
      'the survey has no such attribute: do not answer with another attribute in its place.',
  }
}

/**
 * Lists the queryable entities and their attributes, or one entity.
 * @returns {object} The entities.
 */
const listEntities = (input: Input, ctx: any) => {
  const { survey, cycle, lang, includeAnalysis } = getAnalysisContext(ctx)
  const entityDefs = QueryNodeDefs.getQueryableEntityDefs({ survey, cycle })
  const toItem = (entityDef: any) => toEntityItem({ survey, entityDef, cycle, lang, includeAnalysis })

  if (input.search?.trim()) {
    return searchAttributes({ entities: entityDefs.map(toItem), search: input.search, budget: getResultBudget(ctx) })
  }
  if (input.entity) {
    const entityDef = entityDefs.find((nodeDef: any) => NodeDef.getName(nodeDef) === input.entity)
    if (!entityDef) {
      throw new AiToolFailure(
        'unknownEntity',
        `Unknown entity; valid entities: ${entityDefs.map(NodeDef.getName).join(', ')}`
      )
    }
    const item = toItem(entityDef)
    // the wrapper of the single entity counts in the budget
    const wrapperLength = JSON.stringify({ entities: [], truncated: true }).length
    const fitted = fitListToBudget(item, 'attributes', getResultBudget(ctx) - wrapperLength)
    return { entities: [fitted], truncated: fitted.truncated ?? false }
  }

  const result = { entities: entityDefs.map(toItem) }
  if (JSON.stringify(result).length <= getResultBudget(ctx)) return result
  return {
    entities: result.entities.map(({ attributes: _attributes, ...entity }) => entity),
    attributesOmitted: true,
    hint: 'Call query_listEntities again with "entity" to get the attributes of one entity.',
  }
}

export const listEntitiesTool: AiTool<Input, unknown> = {
  name: 'query_listEntities',
  description:
    'Lists the entities that can be queried and their attributes (name, label, type; "dimension" = can group by, ' +
    '"measure" = can be aggregated). An entity can also use the attributes of its ancestor entities. ' +
    'The root entity (oneRowPerRecord) has one row per record: count it to count records. "rowKeys" are the ' +
    'attributes that together identify one row (the keys of the ancestors and its own): to read one row, filter ' +
    'on all of them. With "search", returns the attributes matching a text, or says that none does.',
  inputSchema,
  area: ['analysis', 'cleaning'],
  dataClass: 'schema',
  requires: canViewCurrentSurvey,
  // synchronous work: a throw still becomes a rejection, as with an async function
  execute: (input, ctx) => Promise.resolve().then(() => listEntities(input, ctx)),
}
