import { Objects } from '@openforis/arena-core'

import SqlSelectOlapBuilder from '@common/model/db/sql/sqlSelectOlapBuilder'
import TableOlapData from '@common/model/db/tables/olapData/table'
import { Query, Sort } from '@common/model/query'

import * as Survey from '@core/survey/survey'

import { db } from '@server/db/db'

const _getSelectQuery = ({ survey, cycle, query }) => {
  const entityDefUuid = Query.getEntityDefUuid(query)

  const entityDef = Survey.getNodeDefByUuid(entityDefUuid)(survey)
  const table = new TableOlapData({ survey, cycle, entityDef })

  const queryBuilder = new SqlSelectOlapBuilder({ table, entityDef })

  // base unit uuid
  queryBuilder.select(table.baseUnitUuidColumnName)

  // SELECT dimensions
  Query.getDimensions(query).forEach((nodeDefUuid) => queryBuilder.selectDimension({ nodeDefUuid }))

  // SELECT measures
  Object.entries(Query.getMeasures(query)).forEach(([nodeDefUuid]) => queryBuilder.selectMeasure({ nodeDefUuid }))

  // FROM clause
  queryBuilder.from(table.nameQualified)

  // ORDER BY clause
  const sort = Query.getSort(query)
  const { clause: sortClause, params: sortParams } = Sort.toSql(sort)
  if (Objects.isNotEmpty(sortParams)) {
    queryBuilder.orderBy(sortClause)
    queryBuilder.addParams(sortParams)
  }
  return { select: queryBuilder.build(), queryParams: queryBuilder.params }
}

export const selectFromOlapDataTable = async ({ survey, cycle, query, baseUnitDef, entityDef }, client = db) => {
  const { select, queryParams } = _getSelectQuery({ survey, cycle, query })

  const table = new TableOlapData({ survey, cycle, baseUnitDef, entityDef })
  const dimensionUuids = Query.getDimensions(query)
  const dimensionColumnNames = dimensionUuids.map((dimensionUuid) => {
    const dimensionDef = Survey.getNodeDefByUuid(dimensionUuid)(survey)
    return table.getColumnNameByAttributeDef(dimensionDef)
  })
  const dimensionColumnNamesJoint = dimensionColumnNames.join(', ')

  const areaTableSelect = `SELECT ${dimensionColumnNamesJoint}, SUM(${table.expFactorColumnName}) AS ${SqlSelectOlapBuilder.areaAlias} FROM (
      SELECT DISTINCT(${table.baseUnitUuidColumnName}), ${table.expFactorColumnName}, ${dimensionColumnNamesJoint}
        FROM ${table.nameQualified}
      ) GROUP BY ${dimensionColumnNamesJoint}`

  return client.query(
    `WITH area_table AS (${areaTableSelect})
    ${select}`,
    queryParams
  )
}
