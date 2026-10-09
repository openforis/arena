import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { Query } from '@common/model/query'

import * as ExpressionParser from '@webapp/components/expression/expressionParser'

import { DataExplorerState } from './state'

const { chartTypes } = DataExplorerState

/**
 * Returns the query with its filter normalised as the Explorer expects (e.g. AND → &&, = → ==).
 * @param {object} query - Explorer query.
 * @returns {object} The query to put in the Explorer state.
 */
export const toExplorerQuery = (query: any): any => {
  const filter = Query.getFilter(query)
  return filter ? Query.assocFilter(ExpressionParser.normalize({ expr: filter, canBeCall: true }))(query) : query
}

const isNumericDef = (nodeDef: any): boolean => NodeDef.isInteger(nodeDef) || NodeDef.isDecimal(nodeDef)

/**
 * Returns the chart type that can show the query, if any.
 * @param {object} params - Parameters.
 * @param {object} params.query - Explorer query.
 * @param {object} params.survey - Survey with its node defs.
 * @returns {string|null} Bar for aggregate queries, scatter for raw queries with two numeric attributes, or null.
 */
export const getQueryChartType = ({ query, survey }: { query: any; survey: any }): string | null => {
  if (Query.isModeAggregate(query)) {
    const hasDimension = Query.getDimensions(query).length > 0
    const hasMeasure = Object.values(Query.getMeasures(query) ?? {}).some((fns: any) => fns?.length > 0)
    return hasDimension && hasMeasure ? chartTypes.bar : null
  }
  const numericAttributes = Query.getAttributeDefUuids(query)
    .map((uuid: string) => Survey.getNodeDefByUuid(uuid)(survey))
    .filter((nodeDef: any) => nodeDef && isNumericDef(nodeDef))
  return numericAttributes.length >= 2 ? chartTypes.scatter : null
}
