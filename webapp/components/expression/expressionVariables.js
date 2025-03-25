import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import { types as sqlTypes } from '@common/model/db/sql'
import { ColumnNodeDef } from '@common/model/db/tables/dataNodeDef'

import * as Expression from '@core/expressionParser/expression'
import { ExpressionEditorType } from './expressionEditorType'

// TODO: match all nodeDefTypes and throw an error if unknown:
const sqlTypeByNodeDefType = {
  [NodeDef.nodeDefType.integer]: sqlTypes.bigint,
  [NodeDef.nodeDefType.decimal]: sqlTypes.decimal,
}
const getSqlType = (nodeDef) => sqlTypeByNodeDefType[NodeDef.getType(nodeDef)] ?? sqlTypes.varchar

const getJsVariables = (nodeDef) => [
  {
    label: NodeDef.getName(nodeDef),
    multiple: NodeDef.isMultiple(nodeDef),
    nodeDefType: NodeDef.getType(nodeDef),
    parentUuid: NodeDef.getParentUuid(nodeDef),
    type: getSqlType(nodeDef),
    uuid: NodeDef.getUuid(nodeDef),
    value: NodeDef.getName(nodeDef),
  },
]

const getSqlVariables = (nodeDef, lang) => {
  const columnNames = ColumnNodeDef.getColumnNames(nodeDef)

  // Returns the label of the nodeDef with the col name as suffix (when there are multiple columns)
  const getLabel = (col) =>
    NodeDef.getLabel(nodeDef, lang) +
    (columnNames.length === 1 ? '' : ` - ${ColumnNodeDef.extractColumnName({ nodeDef, columnName: col })}`)

  return columnNames.map((col) => ({
    label: getLabel(col),
    multiple: NodeDef.isMultiple(nodeDef),
    nodeDefType: NodeDef.getType(nodeDef),
    parentUuid: NodeDef.getParentUuid(nodeDef),
    type: getSqlType(nodeDef),
    uuid: NodeDef.getUuid(nodeDef),
    value: col,
  }))
}

const getChildDefVariables = ({
  survey,
  childDef,
  mode,
  lang,
  editorType,
  nodeDefCurrent = null,
  excludeCurrentNodeDef = false,
}) => {
  if (Expression.isValidExpressionType(childDef)) {
    // exclude nodes that reference the current one
    const referenceCurrentNode =
      Boolean(nodeDefCurrent) &&
      Survey.isNodeDefDependentOn(NodeDef.getUuid(childDef), NodeDef.getUuid(nodeDefCurrent))(survey)

    const currentNodeDefExcluded = excludeCurrentNodeDef && nodeDefCurrent && NodeDef.isEqual(nodeDefCurrent)(childDef)

    if (!referenceCurrentNode && !currentNodeDefExcluded) {
      if (editorType === ExpressionEditorType.basic || mode === Expression.modes.json) {
        return getJsVariables(childDef)
      }
      if (mode === Expression.modes.sql) {
        return getSqlVariables(childDef, lang)
      }
    }
  }
  return []
}

const getVariablesFromAncestors = ({
  survey,
  cycle,
  nodeDefContext,
  mode,
  lang,
  editorType,
  nodeDefCurrent = null,
  includeAnalysis = false,
  excludeCurrentNodeDef = false,
}) => {
  const variables = []
  const stack = []
  const entitiesVisitedByUuid = {}

  const isVisited = (nDef) => Boolean(entitiesVisitedByUuid[NodeDef.getUuid(nDef)])
  const markVisited = (nDef) => {
    entitiesVisitedByUuid[NodeDef.getUuid(nDef)] = true
  }
  const visitNext = (nDef) => {
    if (nDef && !isVisited(nDef)) stack.push(nDef)
  }

  // visit nodeDefContext and its ancestors following the hierarchy
  stack.push(nodeDefContext)

  while (stack.length > 0) {
    const nodeDef = stack.pop()

    markVisited(nodeDef)

    if (NodeDef.isVirtual(nodeDef)) {
      const source = Survey.getNodeDefSource(nodeDef)(survey)
      visitNext(source)
    } else {
      // get variables from every child def
      const nodeDefChildren = Survey.getNodeDefChildrenSorted({ nodeDef, includeAnalysis, cycle })(survey)
      nodeDefChildren.forEach((childDef) => {
        variables.push(
          ...getChildDefVariables({ survey, childDef, mode, lang, editorType, nodeDefCurrent, excludeCurrentNodeDef })
        )

        // if the child def is a single entity, include variables from the descendants of that entity
        if (NodeDef.isSingleEntity(childDef)) {
          visitNext(childDef)
        }
      })
    }
    // add parent to stack only if not visited yet
    const parent = Survey.getNodeDefParent(nodeDef)(survey)
    visitNext(parent)
  }
  return variables
}

const getThisVariable = ({ mode, variables, nodeDefCurrent }) => {
  if (mode === Expression.modes.sql) return variables.find((variable) => variable.uuid === nodeDefCurrent.uuid)
  return {
    ...getJsVariables(nodeDefCurrent),
    label: `this (${NodeDef.getName(nodeDefCurrent)})`,
    value: Expression.thisVariable,
  }
}

const getVariablesGroupedByParentUuid = ({
  variables,
  survey,
  mode,
  nodeDefCurrent = null,
  excludeCurrentNodeDef = false,
  includeThis = true,
}) => {
  const variablesGroupedByParentUuid = variables.reduce(
    (byParentUuid, variable) => ({
      ...byParentUuid,
      [variable.parentUuid]: [...(byParentUuid[variable.parentUuid] || []), variable],
    }),
    {}
  )

  const groups = Object.entries(variablesGroupedByParentUuid)
    .map(([parentUuid, variablesParent]) => {
      const parentNodeDef = Survey.getNodeDefByUuid(parentUuid)(survey)
      return {
        label: NodeDef.getName(parentNodeDef),
        options: variablesParent,
        root: NodeDef.isRoot(parentNodeDef),
        hierarchyLevel: NodeDef.getMetaHierarchy(parentNodeDef).length,
      }
    })
    // sort groups by hierarchy level, in descending order
    .sort((groupA, groupB) => groupB.hierarchyLevel - groupA.hierarchyLevel)

  if (!nodeDefCurrent || excludeCurrentNodeDef || !includeThis || NodeDef.isEntity(nodeDefCurrent)) {
    return groups
  }
  // always show current variable at the beginning
  const thisVariable = getThisVariable({ variables, nodeDefCurrent, mode })
  return [thisVariable, ...groups]
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
    // keep order of variables as in the form
    return 0
  })
}

export const getVariables = ({
  survey: surveyParam,
  cycle,
  nodeDefContext,
  mode,
  lang: langPreferred,
  groupByParent,
  editorType,
  nodeDefCurrent = null,
  excludeCurrentNodeDef = false,
  includeAnalysis = false,
}) => {
  const survey = Survey.buildAndAssocDependencyGraph(surveyParam)
  const lang = Survey.getLanguage(langPreferred)(Survey.getSurveyInfo(survey))

  const variables = getVariablesFromAncestors({
    survey,
    cycle,
    nodeDefContext,
    nodeDefCurrent,
    mode,
    lang,
    editorType,
    excludeCurrentNodeDef,
    includeAnalysis,
  })

  _sortVariables({ nodeDefCurrent, variables })

  return groupByParent
    ? getVariablesGroupedByParentUuid({ variables, survey, nodeDefCurrent, excludeCurrentNodeDef })
    : variables
}

export const getVariablesChildren = ({
  survey,
  cycle,
  nodeDefContext,
  nodeDefCurrent,
  mode,
  lang,
  groupByParent,
  excludeCurrentNodeDef,
  includeAnalysis = false,
}) => {
  if (!NodeDef.isEntity(nodeDefContext)) {
    return []
  }
  const nodeDefChildren = Survey.getNodeDefChildrenSorted({ nodeDef: nodeDefContext, includeAnalysis, cycle })(survey)

  const variables = nodeDefChildren.reduce((variablesAcc, childDef) => {
    variablesAcc.push(...getChildDefVariables({ survey, childDef, mode, lang, nodeDefCurrent, excludeCurrentNodeDef }))
    return variablesAcc
  }, [])

  _sortVariables({ nodeDefCurrent, variables })

  return groupByParent
    ? getVariablesGroupedByParentUuid({ variables, survey, nodeDefCurrent, includeThis: false })
    : variables
}
