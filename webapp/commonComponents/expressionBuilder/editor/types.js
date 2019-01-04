import React from 'react'
import * as R from 'ramda'

import { expressionTypes } from '../../../../common/exprParser/exprParser'
import Dropdown from '../../form/dropdown'

const logicalOperators = {
  and: {key: '&&', value: '&&'},
  or: {key: '||', value: '||'},
}

const comparisonOperators = {
  eq: {key: '===', value: '==='},
  notEq: {key: '!==', value: '!=='},
  gt: {key: '>', value: '>'},
  less: {key: '<', value: '<'},
  gtOrEq: {key: '>=', value: '>='},
  lessOrEq: {key: '<=', value: '<='},
}
const arithmeticOperators = {
  add: {key: '+', value: '+'},
  sub: {key: '-', value: '-'},
  mul: {key: '*', value: '*'},
  div: {key: '/', value: '/'},
  mod: {key: '%', value: '%'},
}

const Binary = (props) => {
  const {node, onChange} = props
  const {left, right, operator} = node
  const operators = R.values(comparisonOperators)
  return (
    <div className="binary">
      <TypeSwitch {...props} node={left}
                  onChange={item => onChange(R.assoc('left', item, node))}/>
      <Dropdown items={operators} inputSize={7}
                selection={R.find(R.propEq('key', operator), operators)}
                onChange={item => onChange(R.assoc('operator', item.key, node))}/>
      <TypeSwitch {...props} node={right}
                  onChange={item => onChange(R.assoc('right', item, node))}/>
    </div>
  )
}

const Identifier = ({node, variables, onChange}) => (
  <Dropdown items={variables}
            selection={R.find(R.propEq('value', node.name), variables)}
            itemLabelProp="label" itemKeyProp="value"
            inputSize={25}
            onChange={item => onChange(R.assoc('name', item.value, node))}/>
)

const Literal = ({node, onChange}) => (
  <div>
    <input className="form-input" value={node.raw}
           size={node.raw.length >= 13 ? 17 : node.raw.length + 4}
           onChange={e => onChange(R.pipe(
             R.assoc('raw', e.target.value),
             R.assoc('value', e.target.value),
           )(node))}/>
  </div>
)

const components = {
  [expressionTypes.Identifier]: Identifier,
  // [expressionTypes.MemberExpression]: memberExpression,
  [expressionTypes.Literal]: Literal,
  // [expressionTypes.ThisExpression]: thisExpression,
  // [expressionTypes.CallExpression]: callExpression,
  // [expressionTypes.UnaryExpression]: unaryExpression,
  [expressionTypes.BinaryExpression]: Binary,
  [expressionTypes.LogicalExpression]: Binary,
  // [expressionTypes.GroupExpression]: groupExpression,
}

export const TypeSwitch = (props) => {
  const component = components[R.path(['node', 'type'], props)]
  return React.createElement(component, props)
}




