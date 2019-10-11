import * as R from 'ramda'

import Survey from '../../../core/survey/survey'
import NodeDef from '../../../core/survey/nodeDef'
import NodeDefTable from '../../../common/surveyRdb/nodeDefTable'
import sqlTypes from '../../../common/surveyRdb/sqlTypes'

import Expression from '../../../core/exprParser/expression'

const getJsVariables = (nodeDef, nodeDefCurrent, lang, depth) => {
  const nodeDefName = NodeDef.getName(nodeDef)

  const getValueFnFromParent = () => {
    const parentFnCalls = depth > 0
      ? '.' + R.repeat('parent()', depth).join('.')
      : ''
    return `this${parentFnCalls}.node('${nodeDefName}').getValue()`
  }

  const getValueFnFromContextNode = () => `this.getValue()`

  const valueProp = NodeDef.isCode(nodeDef) || NodeDef.isTaxon(nodeDef)
    ? '.props.code'
    : ''

  const valueFn = NodeDef.getUuid(nodeDef) === NodeDef.getUuid(nodeDefCurrent)
    ? getValueFnFromContextNode()
    : getValueFnFromParent()

  return [{
    value: `${valueFn}${valueProp}`,

    label: NodeDef.getLabel(nodeDef, lang),

    type: NodeDef.isInteger(nodeDef) ? sqlTypes.integer
      : NodeDef.isDecimal(nodeDef) ? sqlTypes.decimal
        : sqlTypes.varchar,
  }]
}

const getSqlVariables = (nodeDef, lang) => {
  const colNames = NodeDefTable.getColNames(nodeDef)

  return colNames.map(col => ({

    value: col,

    label: NodeDef.getLabel(nodeDef, lang) + (
      colNames.length === 1
        ? '' : ' - ' + NodeDefTable.extractColName(nodeDef, col)
    ),

    type: NodeDef.isInteger(nodeDef) ? sqlTypes.integer :
      NodeDef.isDecimal(nodeDef) ? sqlTypes.decimal
        : sqlTypes.varchar,

    uuid: NodeDef.getUuid(nodeDef)
  }))
}

const getChildDefVariables = (survey, nodeDefContext, nodeDefCurrent, mode, depth, lang) => {

  return R.pipe(
    Survey.getNodeDefChildren(nodeDefContext),
    R.map(childDef => {
      if (NodeDef.isEntity(childDef) || NodeDef.isCoordinate(childDef) || NodeDef.isFile(childDef))
        return null
      else if (mode === Expression.modes.sql)
        return getSqlVariables(childDef, lang)
      else if (mode === Expression.modes.json)
        return getJsVariables(childDef, nodeDefCurrent, lang, depth)
    }),
    R.flatten,
    R.reject(R.isNil),
  )(survey)
}

export const getVariables = (survey, nodeDefContext, nodeDefCurrent, mode, depth = 1, preferredLang) => {

  const lang = Survey.getLanguage(preferredLang)(Survey.getSurveyInfo(survey))
  const variables = getChildDefVariables(survey, nodeDefContext, nodeDefCurrent, mode, depth, lang)

  return NodeDef.isRoot(nodeDefContext)
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