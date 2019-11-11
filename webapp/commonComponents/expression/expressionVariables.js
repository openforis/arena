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

const getChildDefVariables = (survey, nodeDefContext, nodeDefCurrent, mode, lang) => R.pipe(
  Survey.getNodeDefChildren(nodeDefContext),
  R.map(childDef => {
    if (!Expression.isValidExpressionType(childDef))
      return null
    else if (nodeDefCurrent !== null && Survey.isNodeDefDependentOn(NodeDef.getUuid(childDef), NodeDef.getUuid(nodeDefCurrent))(survey))
    //exclude nodes that reference the current one
      return null
    else if (mode === Expression.modes.sql)
      return getSqlVariables(childDef, lang)
    else if (mode === Expression.modes.json)
      return getJsVariables(childDef, lang)
  }),
  R.flatten,
  R.reject(R.isNil),
)(survey)

export const getVariables = (survey, nodeDefContext, nodeDefCurrent, mode, preferredLang) => {
  const lang = Survey.getLanguage(preferredLang)(Survey.getSurveyInfo(survey))
  const surveyWithDependencies = R.pipe(
    Survey.buildDependencyGraph,
    graph => Survey.assocDependencyGraph(graph)(survey)
  )(survey)

  const variables = []
  Survey.visitAncestorsAndSelf(nodeDefContext, nodeDef => {
    const childVariables = getChildDefVariables(surveyWithDependencies, nodeDef, nodeDefCurrent, mode, lang)
    variables.push(...childVariables)
  })(surveyWithDependencies)

  return variables
}