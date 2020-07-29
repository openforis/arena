import * as R from 'ramda'
import pgPromise from 'pg-promise'

import { db } from '../../../../db/db'
import * as dbUtils from '../../../../db/dbUtils'

import * as Expression from '../../../../../core/expressionParser/expression'
import * as Survey from '../../../../../core/survey/survey'
import { Schemata, ViewDataNodeDef, ColumnNodeDef } from '../../../../../common/model/db'
import { Sort, Query } from '../../../../../common/model/query'

const _getSelectFieldsMesaures = ({ survey, viewDataNodeDef, measures }) => {
  const fields = []
  const params = {}
  Object.entries(measures).forEach(([nodeDefUuidMeasure, aggFunctions], i) => {
    const paramName = `measure_field_${i}`
    const nodeDefMeasure = Survey.getNodeDefByUuid(nodeDefUuidMeasure)(survey)
    const columnMeasure = new ColumnNodeDef(viewDataNodeDef, nodeDefMeasure).name

    aggFunctions.forEach((aggFn) => {
      let field = `$/${paramName}:name/`
      if (aggFn) {
        const paramNameAlias = `${paramName}_alias`
        const fieldAlias = `$/${paramNameAlias}:name/`
        const measureAlias = `${columnMeasure}_${aggFn}`
        field = `${aggFn}(${field}) AS ${fieldAlias}`
        params[paramNameAlias] = measureAlias
      }
      fields.push(field)
      params[paramName] = columnMeasure
    })
  })
  return { fields, params }
}

const _getSelectFieldsDimensions = ({ survey, viewDataNodeDef, dimensions }) => {
  const fields = []
  const params = {}
  dimensions.forEach((dimension, i) => {
    const paramName = `dimension_field_${i}`
    fields.push(`$/${paramName}:name/`)
    const nodeDefDimension = Survey.getNodeDefByUuid(dimension)(survey)
    const columnDimension = new ColumnNodeDef(viewDataNodeDef, nodeDefDimension).name
    params[paramName] = columnDimension
  })
  return { fields, params }
}

const _getSelectQuery = ({ survey, cycle, query }) => {
  const nodeDef = Survey.getNodeDefByUuid(Query.getEntityDefUuid(query))(survey)
  const viewDataNodeDef = new ViewDataNodeDef(survey, nodeDef)
  const measures = Query.getMeasures(query)
  const dimensions = Query.getDimensions(query)
  const filter = Query.getFilter(query)
  const sort = Query.getSort(query)

  // SELECT fields measures
  const { fields: selectFieldsMeasures, params: selectParamsMeasures } = _getSelectFieldsMesaures({
    survey,
    viewDataNodeDef,
    measures,
  })

  // SELECT fields dimensions
  const { fields: selectFieldsDimensions, params: selectParamsDimensions } = _getSelectFieldsDimensions({
    survey,
    viewDataNodeDef,
    dimensions,
  })

  // WHERE clause
  const { clause: filterClause, params: filterParams } = filter ? Expression.toSql(filter) : {}

  // GROUP clause
  // always group by data_modified (used in sort)
  const groupFields = [ViewDataNodeDef.columnSet.dateModified, ...selectFieldsDimensions]

  // SORT clause
  const { clause: sortClause, params: sortParams } = Sort.toSql(sort)

  const select = `
    SELECT 
      ${selectFieldsMeasures.concat(selectFieldsDimensions).join(', ')}
    FROM 
      ${Schemata.getSchemaSurveyRdb(viewDataNodeDef.surveyId)}.$/table:name/
    WHERE 
      ${ViewDataNodeDef.columnSet.recordCycle} = $/cycle/
      ${R.isNil(filterClause) ? '' : `AND ${filterClause}`}
    GROUP BY ${groupFields.join(', ')}
    ORDER BY
      ${R.isEmpty(sortParams) ? '' : `${sortClause}, `}${ViewDataNodeDef.columnSet.dateModified} DESC NULLS LAST
  `

  const queryParams = {
    table: viewDataNodeDef.name,
    cycle,
    ...selectParamsMeasures,
    ...selectParamsDimensions,
    ...filterParams,
    ...sortParams,
  }

  return { select, queryParams }
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
 * @param {SortCriteria[]} [params.sort=[]] - The sort conditions.
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
  const { limit, offset, stream } = params
  const { select, queryParams } = _getSelectQuery(params)

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
