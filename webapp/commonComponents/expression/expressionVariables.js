import * as R from 'ramda'

import Survey from '@core/survey/survey'
import NodeDef from '@core/survey/nodeDef'
import NodeDefTable from '@common/surveyRdb/nodeDefTable'
import sqlTypes from '@common/surveyRdb/sqlTypes'

import Expression from '@core/expressionParser/expression'

// TODO: match all nodeDefTypes and throw an error if unknown:
const toSqlType = nodeDef =>
  NodeDef.isInteger(nodeDef)
  ? sqlTypes.integer
  : NodeDef.isDecimal(nodeDef)
    ? sqlTypes.decimal
    : sqlTypes.varchar

const getJsVariables = (nodeDef, lang) => [{
  value: NodeDef.getName(nodeDef),
  label: NodeDef.getLabel(nodeDef, lang),
  type: toSqlType(nodeDef),
  // TODO: add uuid here for symmetry?
}]

const getSqlVariables = (nodeDef, lang) => {
  const colNames = NodeDefTable.getColNames(nodeDef)

  // TODO: Explain what getLabel does and why
  const getLabel = col =>
    NodeDef.getLabel(nodeDef, lang) + (
      colNames.length === 1
      ? ''
      : ' - ' + NodeDefTable.extractColName(nodeDef, col)
    )

  return colNames.map(col => ({
    value: col,
    label: getLabel(col),
    type: toSqlType(nodeDef),
    uuid: NodeDef.getUuid(nodeDef)
  }))
}

const isValidExpressionType = childDef =>
  !NodeDef.isEntity(childDef)
  && !NodeDef.isCoordinate(childDef)
  && !NodeDef.isFile(childDef)

const getChildDefVariables = (survey, nodeDefContext, mode, lang) => {

  return R.pipe(
    Survey.getNodeDefChildren(nodeDefContext),
    R.map(childDef => {
      if (!isValidExpressionType(childDef))
        return null
      else if (mode === Expression.modes.sql)
        return getSqlVariables(childDef, lang)
      else if (mode === Expression.modes.json)
        return getJsVariables(childDef, lang)
    }),
    R.flatten,
    R.reject(R.isNil),
  )(survey)
}

export const getVariables = (survey, nodeDefContext, mode, preferredLang) => {

  const lang = Survey.getLanguage(preferredLang)(Survey.getSurveyInfo(survey))
  const variables = getChildDefVariables(survey, nodeDefContext, mode, lang)

  return NodeDef.isRoot(nodeDefContext)
    ? variables
    : R.concat(
      variables,
      getVariables(
        survey,
        Survey.getNodeDefParent(nodeDefContext)(survey),
        null,
        mode,
      )
    )
}