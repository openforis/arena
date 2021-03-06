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

const getChildDefVariables = ({ survey, nodeDefCurrent, childDef, mode, lang }) => {
  if (Expression.isValidExpressionType(childDef)) {
    // exclude nodes that reference the current one
    const referenceCurrentNode =
      Boolean(nodeDefCurrent) &&
      Survey.isNodeDefDependentOn(NodeDef.getUuid(childDef), NodeDef.getUuid(nodeDefCurrent))(survey)

    if (!referenceCurrentNode) {
      if (mode === Expression.modes.sql) {
        return getSqlVariables(childDef, lang)
      }

      if (mode === Expression.modes.json) {
        return getJsVariables(childDef)
      }
    }
  }
  return []
}

const getVariablesFromAncestors = ({ survey, nodeDefContext, nodeDefCurrent, mode, lang }) => {
  const variables = []

  const includeAnalysis = Boolean(nodeDefContext) && NodeDef.isAnalysis(nodeDefContext)
  const stack = []
  const entitiesVisitedByUuid = {}

  // visit nodeDefContext and its ancestors following the hierarchy
  stack.push(nodeDefContext)

  while (stack.length > 0) {
    const nodeDef = stack.pop()

    entitiesVisitedByUuid[NodeDef.getUuid(nodeDef)] = true

    if (!NodeDef.isVirtual(nodeDef) || !NodeDef.isEqual(nodeDefContext)(nodeDef)) {
      // get variables from every child def
      const nodeDefChildren = Survey.getNodeDefChildren(nodeDef, includeAnalysis)(survey)
      nodeDefChildren.forEach((childDef) => {
        variables.push(...getChildDefVariables({ survey, nodeDefCurrent, childDef, mode, lang }))

        // if the child def is a single entity, include variables from the descendants of that entity
        if (NodeDef.isSingleEntity(childDef) && !entitiesVisitedByUuid[NodeDef.getUuid(childDef)]) {
          stack.push(childDef)
        }
      })
    }
    // add parent to stack only if not visited yet
    const parent = Survey.getNodeDefParent(nodeDef)(survey)
    if (parent && !entitiesVisitedByUuid[NodeDef.getUuid(parent)]) {
      stack.push(parent)
    }
  }
  return variables
}

const getVariablesGroupedByParentUuid = ({ variables, survey }) => {
  const variablesGroupedByParentUuid = (variables || []).reduce(
    (byParentUuid, variable) => ({
      ...byParentUuid,
      [variable.parentUuid]: [...(byParentUuid[variable.parentUuid] || []), variable],
    }),
    {}
  )

  return Object.entries(variablesGroupedByParentUuid)
    .map(([parentUuid, variablesParent]) => {
      const parentNodeDef = Survey.getNodeDefByUuid(parentUuid)(survey)
      return {
        label: NodeDef.getName(parentNodeDef),
        options: variablesParent,
        root: NodeDef.isRoot(parentNodeDef),
      }
    })
    .sort((groupA, groupB) => (groupA.label > groupB.label ? 1 : -1))
}

const _sortVariables = ({ nodeDefCurrent, variables }) => {
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

  const variables = getVariablesFromAncestors({ survey, nodeDefContext, nodeDefCurrent, mode, lang })

  _sortVariables({ nodeDefCurrent, variables })

  return groupByParent ? getVariablesGroupedByParentUuid({ variables, survey }) : variables
}

export const getVariablesChildren = ({ survey, nodeDefContext, nodeDefCurrent, mode, lang, groupByParent }) => {
  if (!NodeDef.isEntity(nodeDefContext)) {
    return []
  }
  const includeAnalysis = Boolean(nodeDefContext) && NodeDef.isAnalysis(nodeDefContext)
  const nodeDefChildren = Survey.getNodeDefChildren(nodeDefContext, includeAnalysis)(survey)

  const variables = nodeDefChildren.reduce((variablesAcc, childDef) => {
    variablesAcc.push(...getChildDefVariables({ survey, nodeDefCurrent, childDef, mode, lang }))
    return variablesAcc
  }, [])

  _sortVariables({ nodeDefCurrent, variables })

  return groupByParent ? getVariablesGroupedByParentUuid({ variables, survey }) : variables
}
