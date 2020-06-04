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

const getJsVariables = (nodeDef) => [
  {
    value: NodeDef.getName(nodeDef),
    label: NodeDef.getName(nodeDef),
    type: toSqlType(nodeDef),
    uuid: NodeDef.getUuid(nodeDef),
  },
]

const getSqlVariables = (nodeDef, lang) => {
  const colNames = NodeDefTable.getColNames(nodeDef)

  // Returns the label of the nodeDef with the col name as suffix (when there are multiple columns)
  const getLabel = (col) =>
    NodeDef.getLabel(nodeDef, lang) + (colNames.length === 1 ? '' : ` - ${NodeDefTable.extractColName(nodeDef, col)}`)

  return colNames.map((col) => ({
    value: col,
    label: getLabel(col),
    type: toSqlType(nodeDef),
    uuid: NodeDef.getUuid(nodeDef),
  }))
}

const getChildDefVariables = (survey, nodeDefContext, nodeDefCurrent, mode, lang) =>
  R.pipe(
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
        return getSqlVariables(childDef, lang)
      }

      if (mode === Expression.modes.json) {
        return getJsVariables(childDef)
      }

      return null
    }),
    R.flatten,
    R.reject(R.isNil)
  )(survey)

export const getVariables = (survey, nodeDefContext, nodeDefCurrent, mode, langPreferred) => {
  const surveyWithDependencies = Survey.buildAndAssocDependencyGraph(survey)
  const lang = Survey.getLanguage(langPreferred)(Survey.getSurveyInfo(survey))

  const variables = []
  Survey.visitAncestorsAndSelf(nodeDefContext, (nodeDef) => {
    if (!NodeDef.isVirtual(nodeDef) || !NodeDef.isEqual(nodeDefContext)(nodeDef)) {
      const childVariables = getChildDefVariables(surveyWithDependencies, nodeDef, nodeDefCurrent, mode, lang)
      variables.push(...childVariables)
    }
  })(surveyWithDependencies)

  // Show current node def variable in the first position
  const nodeDefCurrentUuid = NodeDef.getUuid(nodeDefCurrent)
  variables.sort((varA, varB) => {
    if (varA.uuid === nodeDefCurrentUuid) {
      return -1
    }
    if (varB.uuid === nodeDefCurrentUuid) {
      return 1
    }
    return varA.label.localeCompare(varB.label)
  })

  return variables
}
