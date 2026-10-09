import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Expression from '@core/expressionParser/expression'
import { Query, SortCriteria } from '@common/model/query'

import type { AnalysisQueryEntry } from '@webapp/ai/tools/analysis/queryStore'
import { getQueryChartType } from '@webapp/store/dataExplorer/explorerQuery'

export type QueryCardModel = {
  queryId: string
  explanation: string
  entity: string
  mode: 'raw' | 'aggregate'
  columns: string[]
  dimensions: string[]
  measures: { attribute: string; functions: string[] }[]
  filter: string | null
  sort: { attribute: string; order: 'asc' | 'desc' }[]
  chartType: string | null
}

/**
 * Builds what the query card shows.
 * @param {object} params - Parameters.
 * @param {AnalysisQueryEntry} params.entry - Stored query.
 * @param {object} params.survey - The survey.
 * @param {string} params.lang - Label language.
 * @returns {QueryCardModel} The card model.
 */
export const buildQueryCardModel = ({
  entry,
  survey,
  lang,
}: {
  entry: AnalysisQueryEntry
  survey: any
  lang: string
}): QueryCardModel => {
  const query: any = entry.query
  const getLabel = (uuid: string): string => {
    const nodeDef = Survey.getNodeDefByUuid(uuid)(survey)
    return nodeDef ? NodeDef.getLabel(nodeDef, lang) : uuid
  }
  const aggregate = Query.isModeAggregate(query)
  const filter = Query.getFilter(query)
  return {
    queryId: entry.id,
    explanation: entry.explanation,
    entity: getLabel(Query.getEntityDefUuid(query)),
    mode: aggregate ? 'aggregate' : 'raw',
    columns: aggregate ? [] : Query.getAttributeDefUuids(query).map(getLabel),
    dimensions: aggregate ? Query.getDimensions(query).map(getLabel) : [],
    measures: aggregate
      ? Object.entries(Query.getMeasures(query) ?? {}).map(([uuid, functions]: [string, any]) => ({
          attribute: getLabel(uuid),
          functions,
        }))
      : [],
    filter: filter ? Expression.toString(filter, Expression.modes.sql) : null,
    sort: (Query.getSort(query) ?? []).map((criteria: any) => ({
      attribute: SortCriteria.getLabel(criteria) || SortCriteria.getVariable(criteria),
      order: SortCriteria.getOrder(criteria),
    })),
    chartType: getQueryChartType({ query, survey }),
  }
}
