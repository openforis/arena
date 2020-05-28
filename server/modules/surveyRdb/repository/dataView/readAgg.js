import * as R from 'ramda'
import pgPromise from 'pg-promise'

import * as Schemata from '@common/model/db/schemata'
import { db } from '../../../../db/db'
import * as dbUtils from '../../../../db/dbUtils'

import * as SortCriteria from '../../../../../common/surveyRdb/sortCriteria'
import * as DataSort from '../../../../../common/surveyRdb/dataSort'
import * as DataFilter from '../../../../../common/surveyRdb/dataFilter'
import { ViewDataNodeDef } from '../../../../../common/model/db'

const _getSelectFieldsDimensions = (dimensions) => {
  const fields = []
  const params = {}
  dimensions.forEach((dimension, i) => {
    const paramName = `dimension_field_${i}`
    fields.push(`$/${paramName}:name/`)
    params[paramName] = dimension
  })
  return { fields, params }
}

const _getSelectFieldsMesaures = (measures) => {
  const fields = []
  const params = {}
  Object.entries(measures).forEach(([measure, aggFunctions], i) => {
    const paramName = `measure_field_${i}`
    aggFunctions.forEach((aggFn) => {
      let field = `$/${paramName}:name/`
      if (aggFn) {
        const paramNameAlias = `${paramName}_alias`
        const fieldAlias = `$/${paramNameAlias}:name/`
        const measureAlias = `${measure}_${aggFn}`
        field = `${aggFn}(${field}) AS ${fieldAlias}`
        params[paramNameAlias] = measureAlias
      }
      fields.push(field)
      params[paramName] = measure
    })
  })
  return { fields, params }
}

/**
 * Counts the number of rows of a data view associated to an entity node definition,
 * aggregated by the given measures aggregate functions, grouped by the given dimensions and
 * filtered by the given filter.
 *
 * @param {!object} params - The query parameters.
 * @param {!number} [params.surveyId] - The survey ID.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!string} [params.table] - The view to select.
 * @param {!object} [params.measures] - The measures object, indexed by column names.
 * @param {boolean} [params.dimensions=[]] - The dimensions to select.
 * @param {object} [params.filter=null] - The filter expression object.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<number>} - The count of rows.
 */
export const countViewDataAgg = async (params, client = db) => {
  const { surveyId, cycle, table, measures, dimensions, filter } = params

  // SELECT fields measures
  const { fields: selectFieldsMeasures, params: selectParamsMeasures } = _getSelectFieldsMesaures(measures)

  // SELECT fields dimensions
  const { fields: selectFieldsDimensions, params: selectParamsDimensions } = _getSelectFieldsDimensions(dimensions)

  // WHERE clause
  const { clause: filterClause, params: filterParams } = filter ? DataFilter.getWherePreparedStatement(filter) : {}

  // GROUP clause
  const groupClause = selectFieldsDimensions.length > 0 ? `GROUP BY ${selectFieldsDimensions.join(', ')}` : ''

  return client.one(
    `
    SELECT COUNT(*) AS count
    FROM (
      SELECT ${selectFieldsMeasures.concat(selectFieldsDimensions).join(', ')}, COUNT(*) AS count
      FROM 
        ${Schemata.getSchemaSurveyRdb(surveyId)}.$/table:name/
      WHERE 
        ${ViewDataNodeDef.columnSet.recordCycle} = $/cycle/
        ${R.isNil(filterClause) ? '' : ` AND ${filterClause}`}
      ${groupClause}
    ) AS t
    `,
    {
      table,
      cycle,
      ...selectParamsMeasures,
      ...selectParamsDimensions,
      ...filterParams,
    },
    (row) => Number(row.count)
  )
}

/**
 * Runs a select query on a data view associated to an entity node definition,
 * aggregating the rows by the given measures aggregate functions and grouping by the given dimensions.
 *
 * @param {!object} params - The query parameters.
 * @param {!number} [params.survey] - The survey.
 * @param {!string} [params.cycle] - The survey cycle.
 * @param {!string} [params.table] - The view to select.
 * @param {!object} [params.measures] - The measures object, indexed by column names.
 * @param {boolean} [params.dimensions=[]] - The dimensions to select.
 * @param {object} [params.filter=null] - The filter expression object.
 * @param {number} [params.offset=null] - The query offset.
 * @param {number} [params.limit=null] - The query limit.
 * @param {SortCriteria[]} [params.sort=[]] - The sort conditions.
 * @param {boolean} [params.stream=false] - Whether to fetch rows to be streamed.
 * @param {pgPromise.IDatabase} [client=db] - The database client.
 *
 * @returns {Promise<any[]>} - An object with fetched rows and selected fields.
 */
export const fetchViewDataAgg = async (params, client = db) => {
  const { surveyId, cycle, table, measures, dimensions, filter, limit, offset, sort, stream } = params

  // SELECT fields measures
  const { fields: selectFieldsMeasures, params: selectParamsMeasures } = _getSelectFieldsMesaures(measures)

  // SELECT fields dimensions
  const { fields: selectFieldsDimensions, params: selectParamsDimensions } = _getSelectFieldsDimensions(dimensions)

  // WHERE clause
  const { clause: filterClause, params: filterParams } = filter ? DataFilter.getWherePreparedStatement(filter) : {}

  // GROUP clause
  // always group by data_modified (used in sort)
  const groupFields = [ViewDataNodeDef.columnSet.dateModified, ...selectFieldsDimensions]

  // SORT clause
  const { clause: sortClause, params: sortParams } = DataSort.getSortPreparedStatement(sort)

  const select = `
    SELECT 
      ${selectFieldsMeasures.concat(selectFieldsDimensions).join(', ')}
    FROM 
      ${Schemata.getSchemaSurveyRdb(surveyId)}.$/table:name/
    WHERE 
      ${ViewDataNodeDef.columnSet.recordCycle} = $/cycle/
      ${R.isNil(filterClause) ? '' : `AND ${filterClause}`}
    GROUP BY ${groupFields.join(', ')}
    ORDER BY
      ${R.isEmpty(sortParams) ? '' : `${sortClause}, `}${ViewDataNodeDef.columnSet.dateModified} DESC NULLS LAST
    ${R.isNil(limit) ? '' : 'LIMIT $/limit/'}
    ${R.isNil(offset) ? '' : 'OFFSET $/offset/'}
  `
  const queryParams = {
    table,
    cycle,
    ...selectParamsMeasures,
    ...selectParamsDimensions,
    ...filterParams,
    ...sortParams,
    limit,
    offset,
  }

  return stream ? new dbUtils.QueryStream(dbUtils.formatQuery(select, queryParams)) : client.any(select, queryParams)
}
