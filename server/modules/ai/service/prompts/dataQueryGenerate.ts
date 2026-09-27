/**
 * Prompt builder for the natural-language → Data Explorer query feature.
 *
 * The model receives a compact description of the survey schema (queryable
 * entities, their attributes and which of them can be used as dimensions or
 * measures) and the user's request, and must answer with a single JSON object
 * describing the query using node def NAMES. The service resolves the names
 * into node def UUIDs and validates the result against the same rules used by
 * the Data Explorer UI (`@common/model/query/queryNodeDefs`).
 *
 * Plain-text JSON (instead of the SDK's structured output) because tiny local
 * models frequently fail on json mode; see `responseParsers.js`.
 */
import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { Query, QueryNodeDefs } from '@common/model/query'
import { ColumnNodeDef } from '@common/model/db/tables/dataNodeDef'

import { pq } from './promptSafety'

const MAX_ATTRIBUTES_PER_ENTITY = 150
const MAX_DESCRIPTION_IN_PROMPT = 2000

const aggregateFunctions = Object.values(Query.DEFAULT_AGGREGATE_FUNCTIONS)

const system = `You are an assistant that builds data queries for the Data Explorer of Open Foris Arena,
a platform for field inventories and surveys (e.g. forest inventories with cluster / plot / tree entities).

A query always targets ONE entity (a table: one row per entity instance) and has one of two modes:
- "raw": lists rows; "attributes" are the columns to show.
- "aggregate": groups rows; "dimensions" are the group-by attributes, "measures" are the aggregated values.
  Each measure has one or more aggregate functions among: ${aggregateFunctions.join(', ')}
  (avg = average, cnt = count, max, med = median, min, sum).
  To COUNT the entity instances (e.g. "number of trees"), use the entity name itself as measure attribute
  with the function "cnt".

Schema rules (the schema is given in the user message):
- Only use entity and attribute names that appear in the schema, spelled exactly.
- An entity can use its own attributes and the attributes of its ancestor entities (listed under them).
- Dimensions: only attributes tagged [dimension] of the entity or of its ancestors.
- Measures: only the entity itself (for counting) or attributes tagged [measure] listed directly under the entity.
- Raw mode attributes: any attribute of the entity or of its ancestors.

Filter (optional, null if not needed): a boolean expression evaluated on each row of the entity, using
column names of the entity or of its ancestors. Allowed operators: =, !=, >, <, >=, <=, AND, OR, +, -, *, /,
parentheses. Strings in double quotes. Examples: dbh > 20 AND tree_status = "L" ; plot_id = 3.
For code attributes the column "<name>" contains the code and "<name>_label" the label;
for taxon attributes "<name>" contains the taxon code and "<name>_scientific_name" the scientific name.

Sort (optional, empty list if not needed): list of { "attribute", "order" } where attribute is one of the
selected raw attributes (raw mode) or one of the dimensions (aggregate mode) and order is "asc" or "desc".

Also suggest a short query name (lowercase letters, digits and underscores only, max 40 chars), a human readable
label, a one-sentence description of what the query shows, and a short explanation for the user.

Output format (very important):
Reply with EXACTLY one JSON object, nothing else, in this exact shape:
{
  "entity": "<entity name>",
  "mode": "raw" | "aggregate",
  "attributes": ["<attribute name>", ...],
  "dimensions": ["<attribute name>", ...],
  "measures": [{ "attribute": "<attribute or entity name>", "functions": ["cnt"] }],
  "filter": "<filter expression>" | null,
  "sort": [{ "attribute": "<attribute name>", "order": "asc" }],
  "name": "<query_name>",
  "label": "<query label>",
  "description": "<query description>",
  "explanation": "<short explanation of the query for the user>"
}
- In raw mode "attributes" must contain at least one attribute, "dimensions" and "measures" must be empty.
- In aggregate mode "dimensions" and "measures" must contain at least one item each, "attributes" must be empty.
- Do not wrap the JSON in code fences or backticks.
- Do not add prose before or after the JSON.

Example: in a survey with entities cluster / plot / tree, where tree has the attributes species (taxon, [dimension])
and dbh (decimal, [measure]), the request "number of trees by species" becomes:
{"entity":"tree","mode":"aggregate","attributes":[],"dimensions":["species"],"measures":[{"attribute":"tree","functions":["cnt"]}],"filter":null,"sort":[],"name":"trees_by_species","label":"Number of trees by species","description":"Number of trees grouped by species.","explanation":"Counts the trees grouped by species."}
and "average dbh of trees with dbh greater than 10 by plot" becomes:
{"entity":"tree","mode":"aggregate","attributes":[],"dimensions":["plot_id"],"measures":[{"attribute":"dbh","functions":["avg"]}],"filter":"dbh > 10","sort":[{"attribute":"plot_id","order":"asc"}],"name":"avg_dbh_by_plot","label":"Average DBH by plot","description":"Average DBH of trees with DBH greater than 10, grouped by plot.","explanation":"Averages the DBH of the trees with DBH > 10 for each plot."}`

const describeAttribute = ({ survey, nodeDef, entityDef, lang, cycle, includeAnalysis }) => {
  const name = NodeDef.getName(nodeDef)
  const type = NodeDef.getType(nodeDef)
  const label = NodeDef.getLabel(nodeDef, lang)
  const tags: string[] = []
  if (NodeDef.isKey(nodeDef)) tags.push('key')
  if (NodeDef.isMultiple(nodeDef)) tags.push('multiple')
  if (NodeDef.isSingle(nodeDef) && QueryNodeDefs.isDimensionEligible(nodeDef)) tags.push('dimension')
  const isDirectChild = NodeDef.getParentUuid(nodeDef) === NodeDef.getUuid(entityDef)
  if (
    isDirectChild &&
    QueryNodeDefs.getMeasureAttributeDefs({ survey, entityDef, cycle, includeAnalysis }).includes(nodeDef)
  ) {
    tags.push('measure')
  }
  let extra = ''
  if (NodeDef.isCode(nodeDef)) {
    const category = Survey.getCategoryByUuid(NodeDef.getCategoryUuid(nodeDef))(survey)
    if (category) extra += ` category=${pq(category.props?.name, 100)}`
  }
  const columnNames = ColumnNodeDef.getColumnNames(nodeDef)
  if (columnNames.length > 1) {
    extra += ` columns=${columnNames.join(',')}`
  }
  const labelPart = label && label !== name ? ` label=${pq(label, 150)}` : ''
  const tagsPart = tags.map((tag) => ` [${tag}]`).join('')
  return `    - ${name} (${type})${labelPart}${tagsPart}${extra}`
}

/**
 * Builds the compact schema description included in the user prompt.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey.
 * @param {string} params.cycle - The survey cycle.
 * @param {string} params.lang - The language used for the labels.
 * @param {boolean} [params.includeAnalysis] - Whether to include analysis attributes.
 * @returns {string} - The schema description.
 */
export const buildSchemaDescription = ({ survey, cycle, lang, includeAnalysis = false }) => {
  const entityDefs = QueryNodeDefs.getQueryableEntityDefs({ survey, cycle })
  return entityDefs
    .map((entityDef) => {
      const path = Survey.getNodeDefPath({ nodeDef: entityDef, separator: '/' })(survey)
      const label = NodeDef.getLabel(entityDef, lang)
      const labelPart = label && label !== NodeDef.getName(entityDef) ? ` label=${pq(label, 150)}` : ''
      // attributes belonging to this entity (including the ones in its single descendant entities);
      // ancestors' attributes are listed under the ancestors themselves
      const ownAttributeDefs = Survey.getNodeDefDescendantsInSingleEntities({
        nodeDef: entityDef,
        includeAnalysis,
        cycle,
        sorted: true,
        filterFn: (nodeDef) => NodeDef.isAttribute(nodeDef) && NodeDef.isInCycle(cycle)(nodeDef),
      })(survey)
      const attributeLines = ownAttributeDefs
        .slice(0, MAX_ATTRIBUTES_PER_ENTITY)
        .map((nodeDef) => describeAttribute({ survey, nodeDef, entityDef, lang, cycle, includeAnalysis }))
      if (ownAttributeDefs.length > MAX_ATTRIBUTES_PER_ENTITY) {
        attributeLines.push(
          `    - ... (${ownAttributeDefs.length - MAX_ATTRIBUTES_PER_ENTITY} more attributes omitted)`
        )
      }
      return [`- entity ${NodeDef.getName(entityDef)}${labelPart} path=${path}`, ...attributeLines].join('\n')
    })
    .join('\n')
}

/**
 * Builds the system + user prompt pair used to generate a Data Explorer query.
 * @param {object} params - The parameters.
 * @param {object} params.survey - The survey (with node defs).
 * @param {string} params.cycle - The survey cycle.
 * @param {string} params.lang - The language used for the labels (and for the suggested label/description).
 * @param {string} params.description - The user's request in natural language.
 * @param {boolean} [params.includeAnalysis] - Whether to include analysis attributes.
 * @param {{message: string}} [params.previousError] - Error from a previous attempt, fed back to the model.
 * @returns {{ system: string, prompt: string }} - The prompt pair.
 */
export const buildDataQueryGeneratePrompt = ({
  survey,
  cycle,
  lang,
  description,
  includeAnalysis = false,
  previousError = null,
}) => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyName = Survey.getName(surveyInfo)
  const surveyLabel = Survey.getLabel(surveyInfo, lang)

  let prompt = `Survey: ${pq(surveyName, 200)}${surveyLabel ? ` label=${pq(surveyLabel, 200)}` : ''}

Schema (entities in hierarchical order, each followed by its attributes):
${buildSchemaDescription({ survey, cycle, lang, includeAnalysis })}

Write "label", "description" and "explanation" in the language with code ${pq(lang, 16)}.

User request: ${pq(description, MAX_DESCRIPTION_IN_PROMPT)}`

  if (previousError) {
    prompt += `

The previous answer was not valid: ${pq(previousError.message)}
Fix the problems and return ONLY the JSON object as specified — no prose, no fences.`
  }

  return { system, prompt }
}
