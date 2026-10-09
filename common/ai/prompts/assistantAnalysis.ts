/**
 * System prompt of the assistant's Analysis area: builds Explorer queries with tools and,
 * only when data tools are offered, reads their aggregated results.
 */
import * as Survey from '@core/survey/survey'
import { Query } from '@common/model/query'

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
2. For filters on code attributes, call category_findItems to find the codes.
3. Call query_propose with the query. The user sees it as a card with "Open in Explorer" and, when possible,
   "Show as chart". If it returns invalidProposal, fix the issues and propose again.`

const readingWithData = `Reading results:
- You only see results after calling query_run or query_count with a queryId returned by query_propose.
  You cannot run any other query. records_countByStep and records_countOverTime give record counts.
- Compute numbers with aggregate queries (${aggregateFunctions}), never from raw samples.
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
 * @param {object} params.survey - The survey.
 * @param {string} params.cycle - Current cycle key.
 * @param {string} params.lang - Survey language used for the labels.
 * @param {string} params.uiLang - Language of the user's interface (answer language).
 * @param {string|null} [params.viewDescription] - Current view, as the assistant describes it.
 * @param {boolean} params.dataToolsAvailable - Whether query_run and the other data tools are offered.
 * @returns {string} The system prompt.
 */
export const buildAssistantAnalysisPrompt = ({
  survey,
  cycle,
  lang,
  uiLang,
  viewDescription = null,
  dataToolsAvailable,
}: {
  survey: any
  cycle: string
  lang: string
  uiLang: string
  viewDescription?: string | null
  dataToolsAvailable: boolean
}): string => {
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyLabel = Survey.getLabel(surveyInfo, lang)
  const context = [
    `- Survey: ${pq(Survey.getName(surveyInfo), 200)}${surveyLabel ? ` label=${pq(surveyLabel, 200)}` : ''}`,
    `- Survey languages: ${(Survey.getLanguages(surveyInfo) as string[]).join(', ')}; labels are in ${pq(lang, 16)}`,
    `- Current cycle: ${pq(cycle, 16)}`,
    viewDescription ? `- Current view: ${pq(viewDescription, 300)}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  return [
    assistantMarkers.analysis,
    intro,
    `Query rules:\n${getDataQueryRules({ schemaSource: 'the schema is returned by query_listEntities' })}`,
    `Examples (each JSON object is a query_propose input):\n${dataQueryExamples}`,
    dataToolsAvailable ? readingWithData : readingWithoutData,
    `Context:\n${context}`,
    `Answer in ${getAnswerLanguageLabel(uiLang)}. Be brief.`,
  ].join('\n\n')
}
