import * as R from 'ramda'
import pgPromise from 'pg-promise'

import { db } from '../../../../db/db'
import * as dbUtils from '../../../../db/dbUtils'

import * as Expression from '../../../../../core/expressionParser/expression'
import * as Survey from '../../../../../core/survey/survey'
import { Schemata, ViewDataNodeDef } from '../../../../../common/model/db'
import { Sort, Query } from '../../../../../common/model/query'
import SqlSelectAggBuilder from '../../../../../common/model/db/sql/sqlSelectAggBuilder'

const _getSelectQuery = ({ survey, cycle, query }) => {
  const entityDefUuid = Query.getEntityDefUuid(query)
  const filter = Query.getFilter(query)

  const nodeDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef)

  const queryBuilder = new SqlSelectAggBuilder({ viewDataNodeDef })

  // SELECT measures
  const measures = Query.getMeasures(query)
  Array.from(measures.entries()).forEach(([nodeDefUuid, aggFunctions], index) =>
    queryBuilder.selectMeasure({ aggFunctions, nodeDefUuid, index, cycle, filter: Query.getFilter(query) })
  )

  // SELECT dimensions
  const dimensions = Query.getDimensions(query)
  dimensions.forEach((dimension, index) => queryBuilder.selectDimension({ dimension, index }))

  // FROM clause
  queryBuilder.from(`${Schemata.getSchemaSurveyRdb(viewDataNodeDef.surveyId)}.$/table:name/`)
  queryBuilder.addParams({ table: viewDataNodeDef.name })

  // WHERE clause
  queryBuilder.where(`${ViewDataNodeDef.columnSet.recordCycle} = $/cycle/`)
  queryBuilder.addParams({ cycle })

  const { clause: filterClause, params: filterParams } = filter ? Expression.toSql(filter) : {}
  if (filterClause) {
    queryBuilder.where(filterClause)
    queryBuilder.addParams(filterParams)
  }

  // ORDER BY clause
  const sort = Query.getSort(query)
  const { clause: sortClause, params: sortParams } = Sort.toSql(sort)
  if (!R.isEmpty(sortParams)) {
    queryBuilder.orderBy(sortClause)
    queryBuilder.addParams(sortParams)
  }
  return { select: queryBuilder.build(), queryParams: queryBuilder.params }
}

/**
 * Counts the number of rows of a data view associated to an entity node definition,
 * aggregated by the given measures aggregate functions, grouped by the given dimensions and
 * filtered by the given filter.
 *
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The query used to filter the rows.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<number>} - The count of rows.
 */
export const countViewDataAgg = async (params, client = db) => {
  const { survey, cycle, query } = params
  const { select, queryParams } = _getSelectQuery({ survey, cycle, query })

  return client.one(
    `
    SELECT COUNT(*) AS count
    FROM (
      ${select}
    ) AS t
    `,
    { ...queryParams },
    (row) => Number(row.count)
  )
}

/**
 * Runs a select query on a data view associated to an entity node definition,
 * aggregating the rows by the given measures aggregate functions and grouping by the given dimensions.
 *
 * @param {!object} params - The query parameters.
 * @param {!Survey} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!Query} [params.query] - The query object.
 * @param {number} [params.offset=null] - The query offset.
 * @param {number} [params.limit=null] - The query limit.
 * @param {boolean} [params.stream=false] - Whether to fetch rows to be streamed.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewDataAgg = async (params, client = db) => {
  const { survey, cycle, query, limit, offset, stream } = params
  const { select, queryParams } = _getSelectQuery({ survey, cycle, query })

  const selectWithLimit = `${select}     
    ${R.isNil(limit) ? '' : 'LIMIT $/limit/'}
    ${R.isNil(offset) ? '' : 'OFFSET $/offset/'}`

  const queryParamsWithLimit = {
    ...queryParams,
    limit,
    offset,
  }

  return stream
    ? new dbUtils.QueryStream(dbUtils.formatQuery(selectWithLimit, queryParamsWithLimit))
    : client.any(selectWithLimit, queryParamsWithLimit)
}
