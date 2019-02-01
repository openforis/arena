import * as R from 'ramda'

import Survey from '../../../common/survey/survey'
import NodeDef from '../../../common/survey/nodeDef'
import NodeDefTable from '../../../common/surveyRdb/nodeDefTable'
import sqlTypes from '../../../common/surveyRdb/sqlTypes'

import Expression from '../../../common/exprParser/expression'

const getJsVariables = (nodeDef, lang, depth) => {
  const nodeDefName = NodeDef.getNodeDefName(nodeDef)

  const parentFnCalls = depth > 0
    ? '.' + R.repeat('parent()', depth).join('.')
    : ''

  const valueProp = NodeDef.isNodeDefCode(nodeDef) || NodeDef.isNodeDefTaxon(nodeDef)
    ? '.props.code'
    : ''

  return [{
    value: `this${parentFnCalls}.node('${nodeDefName}').getValue()${valueProp}`,

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

const getChildDefVariables = (survey, nodeDef, mode, depth) => {
  const lang = Survey.getDefaultLanguage(
    Survey.getSurveyInfo(survey)
  )

  return R.pipe(
    Survey.getNodeDefChildren(nodeDef),
    R.map(childDef => {
        if (NodeDef.isNodeDefEntity(childDef) || NodeDef.isNodeDefCoordinate(childDef) || NodeDef.isNodeDefFile(childDef))
          return null
        else if (mode === Expression.modes.sql)
          return getSqlVariables(childDef, lang)
        else if (mode === Expression.modes.json)
          return getJsVariables(childDef, lang, depth)
      }
    ),
    R.flatten,
    R.reject(R.isNil),
  )(survey)
}

export const getVariables = (survey, nodeDefContext, nodeDefCurrent, mode, depth = 1) => {

  const variables = getChildDefVariables(survey, nodeDefContext, mode, depth)

  return NodeDef.isNodeDefRoot(nodeDefContext)
    ? variables
    : R.concat(
      variables,
      getVariables(
        survey,
        Survey.getNodeDefParent(nodeDefContext)(survey),
        mode,
        depth + 1
      )
    )
}