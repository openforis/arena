import React from 'react'
import * as R from 'ramda'

import Expression from '../../../../common/exprParser/expression'
import Dropdown from '../../form/dropdown'

const logicalOperators = {
  and: {key: '&&', value: '&&'},
  or: {key: '||', value: '||'},
}

const comparisonOperators = {
  eq: {key: '===', value: '='},
  notEq: {key: '!==', value: '!='},
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

const EditButtons = (props) => {
  const {
    node, onChange,
    canDelete = false, onDelete,
  } = props

  const addLogicalExpr = (operator) => onChange(
    {
      type: Expression.types.LogicalExpression,
      operator,
      left: node,
      right: {
        type: Expression.types.BinaryExpression, operator: '',
        left: {type: Expression.types.Identifier, name: ''},
        right: {type: Expression.types.Literal, value: null, raw: ''}
      }
    }
  )

  return (
    <div className="btns">
      <div className="btns__add">
        <button className="btn btn-s btn-of-light"
                onClick={() => addLogicalExpr(logicalOperators.or.value)}>
          <span className="icon icon-plus icon-8px"/> OR
        </button>
        <button className="btn btn-s btn-of-light"
                onClick={() => addLogicalExpr(logicalOperators.and.value)}>
          <span className="icon icon-plus icon-8px"/> AND
        </button>
      </div>

      <button className="btn btn-s btn-of-light btn-delete btns__last"
              onClick={onDelete}
              aria-disabled={!canDelete}>
        <span className="icon icon-bin icon-10px"/>
      </button>
    </div>
  )
}

const Group = (props) => {
  const {
    node, onChange,
    canDelete,
    level = 0
  } = props
  const {argument} = node

  return (
    <div className="group">
      <h3>(</h3>
      <TypeSwitch {...props}
                  level={level + 1}
                  node={argument}
                  onChange={item => onChange(R.assoc('argument', item, node))}/>
      <div className="footer">
        <h3>)</h3>
        <EditButtons node={node} onChange={onChange}
                     onDelete={() => onChange(argument)} canDelete={true}/>
      </div>
    </div>
  )
}

const Logical = (props) => {
  const {node, onChange, canDelete = false} = props
  const {left, right, operator} = node
  return (
    <div className="logical">
      <TypeSwitch {...props}
                  node={left}
                  canDelete={canDelete}
                  onChange={item => onChange(R.assoc('left', item, node))}
                  onDelete={() => onChange(right)}/>

      <div className="btns">

        <div className="btns__add">
          <button className={`btn btn-s btn-of-light${operator === logicalOperators.or.key ? ' active' : ''}`}
                  onClick={() => onChange(R.assoc('operator', logicalOperators.or.key, node))}>
            OR
          </button>
          <button className={`btn btn-s btn-of-light${operator === logicalOperators.and.key ? ' active' : ''}`}
                  onClick={() => onChange(R.assoc('operator', logicalOperators.and.key, node))}>
            AND
          </button>
        </div>

        <button className="btn btn-s btn-of-light btns__last"
                onClick={() => onChange({
                  type: Expression.types.GroupExpression,
                  argument: node,
                })}>
          group ()
        </button>
      </div>

      <TypeSwitch {...props}
                  node={right}
                  canDelete={true}
                  onChange={item => onChange(R.assoc('right', item, node))}
                  onDelete={() => onChange(left)}/>
    </div>
  )
}

const Binary = (props) => {
  const {
    node, onChange,
    canDelete = false, onDelete,
  } = props
  const {left, right, operator} = node
  const operators = R.concat(
    R.values(arithmeticOperators),
    R.values(comparisonOperators)
  )

  return (
    <div className="binary">
      <TypeSwitch {...props} node={left}
                  onChange={item => onChange(R.assoc('left', item, node))}/>

      <Dropdown items={operators} inputSize={10}
                selection={R.find(R.propEq('key', operator), operators)}
                onChange={item => onChange(
                  R.assoc('operator', R.propOr('', 'key', item), node)
                )}/>

      <TypeSwitch {...props} node={right}
                  onChange={item => onChange(R.assoc('right', item, node))}/>

      <EditButtons node={node} onChange={onChange}
                   onDelete={onDelete} canDelete={canDelete}/>

    </div>
  )
}

const Identifier = ({node, variables, onChange}) => (
  <Dropdown items={variables}
            selection={R.find(R.propEq('value', node.name), variables)}
            itemLabelProp="label" itemKeyProp="value"
            inputSize={25}
            onChange={item => onChange(
              R.assoc('name', R.propOr('', 'value', item), node)
            )}/>
)

const Literal = ({node, onChange}) => (
  <div className="literal">
    <input className="form-input" value={node.raw}
           size={25}
           onChange={e => onChange(R.pipe(
             R.assoc('raw', e.target.value),
             R.assoc('value', e.target.value),
           )(node))}/>
  </div>
)

const components = {
  [Expression.types.Identifier]: Identifier,
  // [Expression.types.MemberExpression]: memberExpression,
  [Expression.types.Literal]: Literal,
  // [Expression.types.ThisExpression]: thisExpression,
  // [Expression.types.CallExpression]: callExpression,
  // [Expression.types.UnaryExpression]: unaryExpression,
  [Expression.types.BinaryExpression]: Binary,
  [Expression.types.LogicalExpression]: Logical,
  [Expression.types.GroupExpression]: Group,
}

export const TypeSwitch = (props) => {
  const component = components[R.path(['node', 'type'], props)]
  return React.createElement(component, props)
}




