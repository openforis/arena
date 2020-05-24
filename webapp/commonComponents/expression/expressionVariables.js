import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import { sqlTypes } from '@common/surveyRdb/sqlTypes'

import * as Expression from '@core/expressionParser/expression'

// TODO: match all nodeDefTypes and throw an error if unknown:
const toSqlType = (nodeDef) => {
  if (NodeDef.isInteger(nodeDef)) {
    return sqlTypes.integer
  }
  if (NodeDef.isDecimal(nodeDef)) {
    return sqlTypes.decimal
  }
  return sqlTypes.varchar
}

const getNodeDefLabel = (nodeDef, nodeDefCurrent, lang, i18n) =>
  `${NodeDef.getLabel(nodeDef, lang)}${
    nodeDefCurrent && NodeDef.isEqual(nodeDef)(nodeDefCurrent) ? ` (${i18n.t('expressionEditor.this')})` : ''
  }`

const getJsVariables = (nodeDef, nodeDefCurrent, lang, i18n) => [
  {
    value: NodeDef.getName(nodeDef),
    label: getNodeDefLabel(nodeDef, nodeDefCurrent, lang, i18n),
    type: toSqlType(nodeDef),
    uuid: NodeDef.getUuid(nodeDef),
  },
]

const getSqlVariables = (nodeDef, nodeDefCurrent, lang) => {
  const colNames = NodeDefTable.getColNames(nodeDef)

  // TODO: Explain what getLabel does and why
  const getLabel = (col) =>
    getNodeDefLabel(nodeDef, nodeDefCurrent, lang) +
    (colNames.length === 1 ? '' : ` - ${NodeDefTable.extractColName(nodeDef, col)}`)

  return colNames.map((col) => ({
    value: col,
    label: getLabel(col),
    type: toSqlType(nodeDef),
    uuid: NodeDef.getUuid(nodeDef),
  }))
}

const getChildDefVariables = (survey, nodeDefContext, nodeDefCurrent, mode, i18n) => {
  const lang = Survey.getLanguage(i18n.lang)(Survey.getSurveyInfo(survey))
  return R.pipe(
    Survey.getNodeDefChildren(nodeDefContext, Boolean(nodeDefContext) && NodeDef.isAnalysis(nodeDefContext)),
    R.map((childDef) => {
      if (!Expression.isValidExpressionType(childDef)) {
        return null
      }

      if (
        Boolean(nodeDefCurrent) &&
        Survey.isNodeDefDependentOn(NodeDef.getUuid(childDef), NodeDef.getUuid(nodeDefCurrent))(survey)
      ) {
        // Exclude nodes that reference the current one
        return null
      }

      if (mode === Expression.modes.sql) {
        return getSqlVariables(childDef, nodeDefCurrent, lang)
      }

      if (mode === Expression.modes.json) {
        return getJsVariables(childDef, nodeDefCurrent, lang, i18n)
      }

      return null
    }),
    R.flatten,
    R.reject(R.isNil)
  )(survey)
}

export const getVariables = (survey, nodeDefContext, nodeDefCurrent, mode, i18n) => {
  const surveyWithDependencies = Survey.buildAndAssocDependencyGraph(survey)

  const variables = []
  Survey.visitAncestorsAndSelf(nodeDefContext, (nodeDef) => {
    if (!NodeDef.isVirtual(nodeDef) || !NodeDef.isEqual(nodeDefContext)(nodeDef)) {
      const childVariables = getChildDefVariables(surveyWithDependencies, nodeDef, nodeDefCurrent, mode, i18n)
      variables.push(...childVariables)
    }
  })(surveyWithDependencies)

  if (nodeDefCurrent) {
    // Move current node def variable to the first position
    const nodeDefCurrentUuid = NodeDef.getUuid(nodeDefCurrent)
    variables.sort((varA, varB) => (varB.uuid === nodeDefCurrentUuid) - (varA.uuid === nodeDefCurrentUuid))
  }
  return variables
}
