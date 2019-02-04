import * as R from 'ramda'

import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'
import NodeDefTable from '../../../common/surveyRdb/nodeDefTable'
import sqlTypes from '../../../common/surveyRdb/sqlTypes'

import Expression from '../../../common/exprParser/expression'

const getJsVariables = (nodeDef, nodeDefCurrent, lang, depth) => {
  const nodeDefName = NodeDef.getNodeDefName(nodeDef)

  const getValueFnFromParent = () => {
    const parentFnCalls = depth > 0
      ? '.' + R.repeat('parent()', depth).join('.')
      : ''
    return `this${parentFnCalls}.node('${nodeDefName}').getValue()${valueProp}`
  }

  const getValueFnFromContextNode = () => `this.getValue()`

  const valueProp = NodeDef.isNodeDefCode(nodeDef) || NodeDef.isNodeDefTaxon(nodeDef)
    ? '.props.code'
    : ''

  const valueFn = NodeDef.getUuid(nodeDef) === NodeDef.getUuid(nodeDefCurrent)
    ? getValueFnFromContextNode()
    : getValueFnFromParent()

  return [{
    value: `${valueFn}${valueProp}`,

    label: NodeDef.getNodeDefLabel(nodeDef, lang),

    type: NodeDef.isNodeDefInteger(nodeDef) ? sqlTypes.integer :
      NodeDef.isNodeDefDecimal(nodeDef) ? sqlTypes.decimal
        : sqlTypes.varchar,
  }]
}

const getSqlVariables = (nodeDef, lang) => {
  const colNames = NodeDefTable.getColNames(nodeDef)

  return colNames.map(col => ({

    value: col,

    label: NodeDef.getNodeDefLabel(nodeDef, lang) + (
      colNames.length === 1
        ? '' : ' - ' + NodeDefTable.extractColName(nodeDef, col)
    ),

    type: NodeDef.isNodeDefInteger(nodeDef) ? sqlTypes.integer :
      NodeDef.isNodeDefDecimal(nodeDef) ? sqlTypes.decimal
        : sqlTypes.varchar,

  }))
}

const getChildDefVariables = (survey, nodeDefContext, nodeDefCurrent, mode, depth) => {
  const lang = Survey.getDefaultLanguage(
    Survey.getSurveyInfo(survey)
  )

  return R.pipe(
    Survey.getNodeDefChildren(nodeDefContext),
    R.map(childDef => {
        if (NodeDef.isNodeDefEntity(childDef) || NodeDef.isNodeDefCoordinate(childDef) || NodeDef.isNodeDefFile(childDef))
          return null
        else if (mode === Expression.modes.sql)
          return getSqlVariables(childDef, lang)
        else if (mode === Expression.modes.json)
          return getJsVariables(childDef, nodeDefCurrent, lang, depth)
      }
    ),
    R.flatten,
    R.reject(R.isNil),
  )(survey)
}

export const getVariables = (survey, nodeDefContext, nodeDefCurrent, mode, depth = 1) => {

  const variables = getChildDefVariables(survey, nodeDefContext, nodeDefCurrent, mode, depth)

  return NodeDef.isNodeDefRoot(nodeDefContext)
    ? variables
    : R.concat(
      variables,
      getVariables(
        survey,
        Survey.getNodeDefParent(nodeDefContext)(survey),
        null,
        mode,
        depth + 1
      )
    )
}