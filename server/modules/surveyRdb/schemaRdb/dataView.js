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
 * Returns the list of column names relative to the specified node def
 * (columns relative to its children and to its ancestors' children).
 *
 * @param {!object} survey - The survey.
 * @param {!object} nodeDef - The context node definition.
 * @returns {Array} List of column names.
 */
export const getNodeDefColumnNames = (survey, nodeDef) => {
  const getNodeDefCols = (nodeDefCurrent, isSelf) => {
    const nodeDefColumns = R.pipe(
      R.map(DataCol.getNames),
      R.flatten
    )(DataTable.getNodeDefColumns(survey, nodeDefCurrent))

    // If is not root, prepend parent uuid
    if (!NodeDef.isRoot(nodeDefCurrent)) {
      nodeDefColumns.unshift(getColUuid(Survey.getNodeDefParent(nodeDefCurrent)(survey)))
    }

    // If nodeDef isSelf (starting nodeDef) prepend col uuid
    if (isSelf) {
      nodeDefColumns.unshift(getColUuid(nodeDefCurrent))
    }
    return nodeDefColumns
  }

  const colNames = []

  Survey.visitAncestorsAndSelf(nodeDef, (nodeDefCurrent) => {
    // Do not include node defs of calculation steps
    const cols = getNodeDefCols(nodeDefCurrent, NodeDef.isEqual(nodeDefCurrent)(nodeDef))
    colNames.unshift(...cols)
  })(survey)

  return colNames
}

/**
 * Generates a list of fields to be used in the projection of the data view.
 * The fields will be related to the node definition specified
 * (columns related to its children definitions or to its ancestors children definitions).
 *
 * @param {!object} survey - The context survey.
 * @param {!object} nodeDef - The node definition.
 * @returns {Array} List of fields.
 */
const _getSelectFieldsNodeDefs = (survey, nodeDef) => {
  const getSelectFieldNodeDef = (nodeDefCurrent, isSelf) => {
    const fieldsNodeDef = R.pipe(
      R.map(DataCol.getNames),
      R.flatten,
      R.map((name) => `${isSelf ? alias : aliasParent}.${name}`)
    )(DataTable.getNodeDefColumns(survey, nodeDefCurrent))

    // If is not root, prepend parent uuid
    if (!NodeDef.isRoot(nodeDefCurrent)) {
      fieldsNodeDef.unshift(`${aliasParent}.${getColUuid(Survey.getNodeDefParent(nodeDefCurrent)(survey))}`)
    }

    // If nodeDef isSelf (starting nodeDef) prepend col uuid
    if (isSelf) {
      fieldsNodeDef.unshift(`${alias}.${DataTable.colNameUuuid} as ${getColUuid(nodeDefCurrent)}`)
    }

    return fieldsNodeDef
  }

  const fields = []

  Survey.visitAncestorsAndSelf(nodeDef, (nodeDefCurrent) => {
    // Do not include node defs of calculation steps
    const fieldsNodeDef = getSelectFieldNodeDef(nodeDefCurrent, NodeDef.isEqual(nodeDefCurrent)(nodeDef))
    fields.unshift(...fieldsNodeDef)
  })(survey)

  return fields
}

export const getSelectFields = (survey, nodeDef, resultStepViews) => {
  if (NodeDef.isVirtual(nodeDef)) {
    return ['*']
  }

  // Add node defs columns
  const fields = _getSelectFieldsNodeDefs(survey, nodeDef)

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
    : `JOIN 
        ${schemaName}.${getName(nodeDefParent)} as ${aliasParent}
        ON ${aliasParent}.${getColUuid(nodeDefParent)} = ${alias}.${DataTable.colNameParentUuuid}
        `

export const getJoinResultStepView = (schemaName, resultStepViews) =>
  R.ifElse(
    R.isEmpty,
    R.always(''),
    R.pipe(
      R.map((resultStepView) => {
        const schemaAndViewName = `${schemaName}."${ResultStepView.getViewName(resultStepView)}"`
        return `LEFT OUTER JOIN ${schemaAndViewName}
          ON ${alias}.${DataTable.colNameUuuid} = ${schemaAndViewName}.${ResultStepView.colNames.parentUuid}`
      }),
      R.join(' ')
    )
  )(resultStepViews)

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
