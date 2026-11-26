/**
 * System prompt of the assistant's Analysis area: builds Explorer queries with tools and,
 * only when data tools are offered, reads their aggregated results.
 */
import { Query } from '@common/model/query'
import * as Survey from '@core/survey/survey'

import { getAnswerLanguageLabel } from './assistantDesign'
import { assistantMarkers } from './assistantMarkers'
import { dataQueryExamples, getDataQueryRules } from './dataQueryGenerate'
import { pq } from './promptSafety'

const aggregateFunctions = Object.values(Query.DEFAULT_AGGREGATE_FUNCTIONS).join(', ')

const intro = `You are the analysis assistant of Open Foris Arena, a platform for field inventories and surveys.
You help the user explore the collected records with Explorer queries. You never change survey or record data.

How to work:
1. Call query_listEntities to learn the entities and their attributes; use the names exactly as returned.
   In its result, "dimension": true and "measure": true are the [dimension] and [measure] tags of the rules below.
   If the survey has no attribute for what the user asks (query_listEntities with "search" finds none), say so
   and name the closest ones: never present another attribute as the one asked for.
2. For filters on code attributes, call category_findItems to find the codes. When the question names a value
   (e.g. "slight damage"), call category_findItems with "search" and no attribute: it tells which attribute has it.
3. Call query_propose with the query. The user sees it as a card with "Open in Explorer" and, when possible,
   "Show as chart". If it returns invalidProposal, fix the issues and propose again.`

const maps = `Maps: Arena has a Map view (Data › Map) that shows coordinate and geo attributes as layers.
To show records on a map, call map_proposeLayer with the attribute; the user sees a card with "Show on map".
To show ONE record, pass its key values (e.g. "EP" or "3 - EP") as search, with the attribute: the map goes to it.
To show a place given as coordinates (lat/lng, DMS or UTM), pass them as search; the attribute is then optional.
The layer shows every record with a value; it cannot be filtered. If the user asks for a subset, say so and offer a query for the subset.
Never suggest exporting the data to GIS software to see it on a map.`

const readingWithData = `Reading results:
- You only see results after calling query_run or query_count with a queryId returned by query_propose.
  You cannot run any other query. records_countByStep and records_countOverTime give record counts:
  a record is one row of the root entity, not of its child entities.
- Compute numbers with aggregate queries (${aggregateFunctions}), never from raw samples.
- Never add, average, count or rank result rows yourself. An overall figure comes from "totals" of the result, or from
  a new aggregate query. For "top N", propose the query with a sort and limit N.
- For one figure with no grouping (e.g. "how many trees", "the mean dbh"), propose an aggregate query with no dimensions
  and run it with query_run.
- A group shown as "(no value)" has no value for that dimension: keep it when you list or rank groups.
- For every number you give, say which query it comes from (for example "query q1").
- If a query times out (queryTimeout), propose a query with more aggregation or a filter.
- A result with total 0 means that no record matches: say so.`

const readingWithoutData = `Reading results:
- You cannot see any result: no record value, count or aggregate reaches you.
- After proposing a query, tell the user to open the card ("Open in Explorer" or "Show as chart") to see the result.
- Never invent or estimate numbers.`

/**
 * Builds the system prompt of the Analysis area.
 * @param {object} params - Parameters.
 * @param {string} params.lang - Survey language used for the labels.
 * @param {string} params.uiLang - Language of the user's interface (answer language).
 * @param {string|null} [params.viewDescription] - Current view, as the assistant describes it.
 * @param {boolean} params.dataToolsAvailable - Whether query_run and the other data tools are offered.
 * @param {boolean} [params.mapToolAvailable] - Whether map_proposeLayer is offered (default false).
 * @returns {string} The system prompt.
 */
export const buildAssistantAnalysisPrompt = ({
  survey,
  cycle,
  lang,
  uiLang,
  viewDescription = null,
  dataToolsAvailable,
  mapToolAvailable = false,
}: {
  survey: any
  cycle: string
  lang: string
  uiLang: string
  viewDescription?: string | null
  dataToolsAvailable: boolean
  mapToolAvailable?: boolean
}): string => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyLabel = Survey.getLabel(surveyInfo, lang)
  const surveyLabelPart = surveyLabel ? ` label=${pq(surveyLabel, 200)}` : ''
  const context = [
    `- Survey: ${pq(Survey.getName(surveyInfo), 200)}${surveyLabelPart}`,
    `- Survey languages: ${(Survey.getLanguages(surveyInfo) as string[]).join(', ')}; labels are in ${pq(lang, 16)}`,
    `- Current cycle: ${pq(cycle, 16)}`,
    viewDescription ? `- Current view: ${pq(viewDescription, 300)}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return [
    assistantMarkers.analysis,
    intro,
    mapToolAvailable ? maps : null,
    `Query rules:\n${getDataQueryRules({ schemaSource: 'the schema is returned by query_listEntities' })}`,
    `Examples (each JSON object is a query_propose input):\n${dataQueryExamples}`,
    dataToolsAvailable ? readingWithData : readingWithoutData,
    `Context:\n${context}`,
    `Answer in ${getAnswerLanguageLabel(uiLang)}. Be brief.`,
  ]
    .filter(Boolean)
    .join('\n\n')
}
