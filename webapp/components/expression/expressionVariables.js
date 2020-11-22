import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefTable from '@common/surveyRdb/nodeDefTable'
import { types as sqlTypes } from '@common/model/db/sql'

import * as Expression from '@core/expressionParser/expression'

// TODO: match all nodeDefTypes and throw an error if unknown:
const toSqlType = (nodeDef) => {
  if (NodeDef.isInteger(nodeDef)) {
    return sqlTypes.bigint
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
    parentUuid: NodeDef.getParentUuid(nodeDef),
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
    parentUuid: NodeDef.getParentUuid(nodeDef),
  }))
}

const getChildDefVariables = ({ survey, nodeDefContext, nodeDefCurrent, mode, lang }) => {
  const variables = []
  const includeAnalysis = Boolean(nodeDefContext) && NodeDef.isAnalysis(nodeDefContext)
  const stack = []

  stack.push(...Survey.getNodeDefChildren(nodeDefContext, includeAnalysis)(survey))

  while (stack.length > 0) {
    const childDef = stack.pop()

    if (NodeDef.isSingleEntity(childDef)) {
      stack.push(...Survey.getNodeDefChildren(childDef, includeAnalysis)(survey))
    } else if (Expression.isValidExpressionType(childDef)) {
      // exclude nodes that reference the current one
      const referenceCurrentNode =
        Boolean(nodeDefCurrent) &&
        Survey.isNodeDefDependentOn(NodeDef.getUuid(childDef), NodeDef.getUuid(nodeDefCurrent))(survey)

      if (!referenceCurrentNode) {
        if (mode === Expression.modes.sql) {
          variables.push(...getSqlVariables(childDef, lang))
        }

        if (mode === Expression.modes.json) {
          variables.push(...getJsVariables(childDef))
        }
      }
    }
  }

  return variables
}

export const getVariablesGroupedByParentUuid = ({ variables, survey: surveyParam }) => {
  const survey = Survey.buildAndAssocDependencyGraph(surveyParam)

  const variablesGroupedByParentUuid = (variables || []).reduce(
    (byParentUuid, variable) => ({
      ...byParentUuid,
      [variable.parentUuid]: [...(byParentUuid[variable.parentUuid] || []), variable],
    }),
    {}
  )

  const variablesGrouped = Object.keys(variablesGroupedByParentUuid)
    .map((parentUuid) => {
      const parentNodeDef = Survey.getNodeDefByUuid(parentUuid)(survey)
      return { parentUuid, label: NodeDef.getName(parentNodeDef), id: Number(NodeDef.getId(parentNodeDef)) }
    })
    .sort((groupA, groupB) => (groupA.id > groupB.id ? 1 : -1))
    .map(({ parentUuid, label }) => ({ label, options: variablesGroupedByParentUuid[parentUuid] }))

  return variablesGrouped
}

export const getVariables = ({ survey: surveyParam, nodeDefContext, nodeDefCurrent, mode, lang: langPreferred }) => {
  const survey = Survey.buildAndAssocDependencyGraph(surveyParam)
  const lang = Survey.getLanguage(langPreferred)(Survey.getSurveyInfo(survey))

  let variables = []
  Survey.visitAncestorsAndSelf(nodeDefContext, (nodeDef) => {
    if (!NodeDef.isVirtual(nodeDef) || !NodeDef.isEqual(nodeDefContext)(nodeDef)) {
      const childVariables = getChildDefVariables({ survey, nodeDefContext: nodeDef, nodeDefCurrent, mode, lang })

      variables.push(...childVariables)
    }
  })(survey)

  const variablesUuids = []
  variables = variables.filter((variable) => {
    if (variablesUuids.includes(variable.uuid)) return false
    variablesUuids.push(variable.uuid)
    return true
  })

  // Show current node def variable in the first position
  const nodeDefCurrentUuid = NodeDef.getUuid(nodeDefCurrent)
  variables = variables.sort((varA, varB) => {
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
