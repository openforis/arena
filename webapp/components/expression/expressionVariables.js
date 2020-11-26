import * as A from '@core/arena'

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

export const getParentsInOrder = ({ parent, survey, includeMultiples = false }) => {
  const _node = !A.isNull(parent) ? parent : Survey.getNodeDefRoot(survey)
  if (NodeDef.isMultiple(_node) && !includeMultiples) return []
  const parents = []
  const children = Survey.getNodeDefChildren(_node)(survey)
  if (children.length > 0) {
    parents.push(_node)
    children.forEach((child) => {
      parents.push(...getParentsInOrder({ parent: child, survey }))
    })
  }
  return parents
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
  const surveyParentsInOrder = getParentsInOrder({ survey })
  const surveyParentsUuidInOrder = surveyParentsInOrder.map(NodeDef.getUuid)

  const variablesGrouped = Object.keys(variablesGroupedByParentUuid)
    .map((parentUuid) => {
      const parentNodeDef = Survey.getNodeDefByUuid(parentUuid)(survey)
      return {
        parentUuid,
        label: NodeDef.getName(parentNodeDef),
        index: Number(surveyParentsUuidInOrder.indexOf(NodeDef.getUuid(parentNodeDef))),
      }
    })
    .sort((groupA, groupB) => (groupA.index > groupB.index ? 1 : -1))
    .map(({ parentUuid, label }) => ({ label, options: variablesGroupedByParentUuid[parentUuid] }))

  return variablesGrouped
}

export const getVariables = ({
  survey: surveyParam,
  nodeDefContext,
  nodeDefCurrent,
  mode,
  lang: langPreferred,
  groupByParent,
}) => {
  const survey = Survey.buildAndAssocDependencyGraph(surveyParam)
  const lang = Survey.getLanguage(langPreferred)(Survey.getSurveyInfo(survey))

  const variables = []
  Survey.visitAncestorsAndSelf(nodeDefContext, (nodeDef) => {
    if (!NodeDef.isVirtual(nodeDef) || !NodeDef.isEqual(nodeDefContext)(nodeDef)) {
      const childVariables = getChildDefVariables({ survey, nodeDefContext: nodeDef, nodeDefCurrent, mode, lang })

      variables.push(...childVariables)
    }
  })(survey)

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

  if (groupByParent) {
    return getVariablesGroupedByParentUuid({ variables, survey })
  }

  return variables
}
