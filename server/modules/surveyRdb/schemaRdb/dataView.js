import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpression from '@core/survey/nodeDefExpression'
import * as Expression from '@core/expressionParser/expression'

import * as SchemaRdb from '@common/surveyRdb/schemaRdb'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import * as ResultStepView from '@common/surveyRdb/resultStepView'

import * as DataTable from './dataTable'
import * as DataCol from './dataCol'

export const getName = NodeDefTable.getViewName
export const getNameWithSchema = (surveyId) => (nodeDef) =>
  `${SchemaRdb.getName(surveyId)}.${NodeDefTable.getViewName(nodeDef)}`

export const alias = 'a'
export const aliasParent = 'p'

export const columns = {
  keys: '_keys',
}

export const getColUuid = (nodeDef) => `${NodeDef.getName(nodeDef)}_${DataTable.colNameUuuid}`

/**
 * Returns the list of column names relative to the specified node def hierarchy.
 *
 * @param {!object} survey - The survey.
 * @param {!object} nodeDef - The context node definition.
 * @param {boolean} [fromDataTable=false] - If false, the columns returned belong to the data view, otherwise from data table and include the alias.
 * @returns {Array} - List of column names.
 */
export const getNodeDefColumnNames = (survey, nodeDef, fromDataTable = false) => {
  const colNames = []

  Survey.visitAncestorsAndSelf(nodeDef, (nodeDefCurrent) => {
    const isSelf = NodeDef.isEqual(nodeDefCurrent)(nodeDef)
    const colUuid = getColUuid(nodeDefCurrent)
    const nodeDefColumnNames = R.pipe(
      DataTable.getNodeDefColumns,
      R.map(DataCol.getNames),
      R.flatten,
      R.when(
        R.always(fromDataTable),
        R.map((colName) => `${isSelf ? alias : aliasParent}.${colName}`)
      ),
      R.ifElse(
        R.always(fromDataTable),
        R.prepend(isSelf ? `${alias}.${DataTable.colNameUuuid} AS ${colUuid}` : `${aliasParent}.${colUuid}`),
        R.prepend(colUuid)
      )
    )(survey, nodeDefCurrent)
    colNames.unshift(...nodeDefColumnNames)
  })(survey)

  return colNames
}

export const getSelectFields = (survey, nodeDef, resultStepViews) => {
  if (NodeDef.isVirtual(nodeDef)) {
    return ['*']
  }

  // Add node defs columns
  const fields = getNodeDefColumnNames(survey, nodeDef, true)

  // Add result step columns
  const nodeDefsCalculationColNames = R.pipe(
    R.map(ResultStepView.getNodeDefColumns),
    R.flatten,
    R.map(DataCol.getNames),
    R.flatten
  )(resultStepViews)

  fields.push(...nodeDefsCalculationColNames)

  // Generate keys column
  const fieldKey = R.pipe(
    Survey.getNodeDefKeys(nodeDef),
    R.map((nodeDefKey) => `'${NodeDef.getUuid(nodeDefKey)}', ${alias}.${DataCol.getName(nodeDefKey)}`),
    R.join(', '),
    (content) => `jsonb_build_object(${content}) AS ${columns.keys}`
  )(survey)

  // Add record_uuid, date_created, date_modified, keys
  fields.unshift(
    `${NodeDef.isRoot(nodeDef) ? alias : aliasParent}.${DataTable.colNameRecordUuuid}`,
    `${alias}.${DataTable.colNameRecordCycle}`,
    `${alias}.${DataTable.colNameDateCreated}`,
    `${alias}.${DataTable.colNameDateModified}`,
    fieldKey
  )

  return fields
}

export const getJoin = (schemaName, nodeDef, nodeDefParent) =>
  NodeDef.isVirtual(nodeDef) || !nodeDefParent
    ? ''
    : `JOIN ${schemaName}.${getName(nodeDefParent)} as ${aliasParent}
        ON ${aliasParent}.${getColUuid(nodeDefParent)} = ${alias}.${DataTable.colNameParentUuuid}`

export const getJoinResultStepView = (survey, nodeDef, resultStepViews = []) => {
  if (resultStepViews.length === 0) {
    return ''
  }

  const schema = SchemaRdb.getName(Survey.getId(survey))

  return resultStepViews
    .map((resultStepView, i) => {
      const viewName = ResultStepView.getViewName(resultStepView)
      const aliasResTable = `r${i}`

      const colUuid = NodeDef.isVirtual(nodeDef)
        ? getColUuid(Survey.getNodeDefParent(nodeDef)(survey))
        : DataTable.colNameUuuid

      return `LEFT OUTER JOIN ${schema}."${viewName}" AS ${aliasResTable}
          ON ${alias}.${colUuid} = ${aliasResTable}.${ResultStepView.colNames.parentUuid}`
    })
    .join(' ')
}

export const getFromTable = (survey, nodeDef) => {
  const nodeDefParent = Survey.getNodeDefParent(nodeDef)(survey)
  if (NodeDef.isVirtual(nodeDef)) {
    return getNameWithSchema(Survey.getId(survey))(nodeDefParent)
  }

  const schemaName = SchemaRdb.getName(Survey.getId(survey))
  const tableName = DataTable.getName(nodeDef, nodeDefParent)
  return `${schemaName}.${tableName}`
}

export const getWhereCondition = (nodeDef) => {
  if (NodeDef.isVirtual(nodeDef) && !R.isEmpty(NodeDef.getFormula(nodeDef))) {
    const expressionSql = R.pipe(
      NodeDef.getFormula,
      R.head,
      NodeDefExpression.getExpression,
      Expression.fromString,
      (expr) => Expression.toString(expr, Expression.modes.sql)
    )(nodeDef)
    return ` WHERE ${expressionSql}`
  }

  return ''
}
