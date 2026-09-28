/**
 * Prompt builder for the "suggest name, label and description" feature of the
 * Data Explorer query manager.
 *
 * The model receives a compact, human readable description of the current
 * query selections (entity, mode, attributes or dimensions / measures,
 * filter, sort) and must answer with a single JSON object containing the
 * suggested query name, label and description.
 *
 * Plain-text JSON (instead of the SDK's structured output) because tiny local
 * models frequently fail on json mode; see `responseParsers.js`.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'
import { Query, SortCriteria } from '@common/model/query'

import { pq } from './promptSafety'

const system = `You are an assistant that names data queries in the Data Explorer of Open Foris Arena,
a platform for field inventories and surveys (e.g. forest inventories with cluster / plot / tree entities).

You are given the definition of a query (target entity, mode, selected attributes or dimensions and measures,
filter and sort). Suggest:
- "name": a short identifier (lowercase letters, digits and underscores only, max 40 chars);
- "label": a short human readable title (max 80 chars);
- "description": one or two sentences describing what the query shows.

Output format (very important):
Reply with EXACTLY one JSON object, nothing else, in this exact shape:
{ "name": "<query_name>", "label": "<query label>", "description": "<query description>" }
- Do not wrap the JSON in code fences or backticks.
- Do not add prose before or after the JSON.

Example: an aggregate query on the entity "tree" with dimension "species" and measure "tree" (cnt) becomes:
{"name":"trees_by_species","label":"Number of trees by species","description":"Number of trees grouped by species."}`

const describeNodeDef = ({ nodeDef, lang }) => {
  const name = NodeDef.getName(nodeDef)
  const label = NodeDef.getLabel(nodeDef, lang)
  return label && label !== name ? `${name} (label=${pq(label, 150)})` : name
}

/**
 * Builds a compact description of the query selections.
 * Node defs not found in the survey are ignored.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey (with node defs).
 * @param {object} params.query - The Data Explorer query.
 * @param {string} params.lang - The language used for the labels.
 * @returns {string} - The query description.
 */
export const describeQuery = ({ survey, query, lang }) => {
  const findNodeDefs = (uuids: string[]) => uuids.map((uuid) => Survey.getNodeDefByUuid(uuid)(survey)).filter(Boolean)
  const describeNodeDefs = (uuids: string[]) =>
    findNodeDefs(uuids)
      .map((nodeDef) => describeNodeDef({ nodeDef, lang }))
      .join(', ')

  const entityDef = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const lines = [`Entity: ${describeNodeDef({ nodeDef: entityDef, lang })}`]

  if (Query.isModeAggregate(query)) {
    lines.push('Mode: aggregate')
    lines.push(`Dimensions: ${describeNodeDefs(Query.getDimensions(query))}`)
    const measures = findNodeDefs(Query.getMeasuresKeys(query)).map(
      (nodeDef) =>
        `${describeNodeDef({ nodeDef, lang })}: ${Query.getMeasureAggregateFunctions(NodeDef.getUuid(nodeDef))(query).join(', ')}`
    )
    lines.push(`Measures: ${measures.join('; ')}`)
  } else {
    lines.push('Mode: raw')
    lines.push(`Attributes: ${describeNodeDefs(Query.getAttributeDefUuids(query))}`)
  }

  const filter = Query.getFilter(query)
  if (filter) {
    lines.push(`Filter: ${pq(Expression.toString(filter, Expression.modes.sql), 1000)}`)
  }
  const sort = Query.getSort(query)
  if (sort.length > 0) {
    const sortParts = sort.map(
      (sortCriteria) => `${SortCriteria.getVariable(sortCriteria)} ${SortCriteria.getOrder(sortCriteria)}`
    )
    lines.push(`Sort: ${sortParts.join(', ')}`)
  }
  return lines.join('\n')
}

/**
 * Builds the system + user prompt pair used to suggest a name, label and description for a Data Explorer query.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey (with node defs).
 * @param {object} params.query - The Data Explorer query.
 * @param {string} params.lang - The language used for the labels and for the suggested label / description.
 * @param {{message: string}} [params.previousError] - Error from a previous attempt, fed back to the model.
 * @returns {{ system: string, prompt: string }} - The prompt pair.
 */
export const buildDataQuerySummarizePrompt = ({ survey, query, lang, previousError = null }) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyName = Survey.getName(surveyInfo)
  const surveyLabel = Survey.getLabel(surveyInfo, lang)

  const surveyLabelPart = surveyLabel ? ` label=${pq(surveyLabel, 200)}` : ''

  let prompt = `Survey: ${pq(surveyName, 200)}${surveyLabelPart}

Query:
${describeQuery({ survey, query, lang })}

Write "label" and "description" in the language with code ${pq(lang, 16)}.`

  if (previousError) {
    prompt += `

The previous answer was not valid: ${pq(previousError.message)}
Fix the problems and return ONLY the JSON object as specified — no prose, no fences.`
  }

  return { system, prompt }
}
