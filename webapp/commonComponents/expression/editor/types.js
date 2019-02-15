import React from 'react'
import * as R from 'ramda'
import axios from 'axios'

import Dropdown from '../../form/dropdown'

import Expression from '../../../../common/exprParser/expression'

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
        left: { type: Expression.types.Identifier, name: '' },
        right: { type: Expression.types.Literal, value: null, raw: '' }
      }
    }
  )

  const { logical } = Expression.operators

  return (
    <div className="btns">
      <div className="btns__add">
        <button className="btn btn-s btn-of-light"
                onClick={() => addLogicalExpr(logical.or.value)}>
          <span className="icon icon-plus icon-8px"/> OR
        </button>
        <button className="btn btn-s btn-of-light"
                onClick={() => addLogicalExpr(logical.and.value)}>
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
    level = 0
  } = props
  const { argument } = node

  return (
    <div className="group">
      <h3>(</h3>
      <ExpressionNode {...props}
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
  const { node, onChange, canDelete = false } = props
  const { left, right, operator } = node
  const { logical } = Expression.operators

  return (
    <div className="logical">
      <ExpressionNode {...props}
                      node={left}
                      canDelete={canDelete}
                      onChange={item => onChange(R.assoc('left', item, node))}
                      onDelete={() => onChange(right)}/>

      <div className="btns">

        <div className="btns__add">
          <button className={`btn btn-s btn-of-light${operator === logical.or.key ? ' active' : ''}`}
                  onClick={() => onChange(R.assoc('operator', logical.or.key, node))}>
            OR
          </button>
          <button className={`btn btn-s btn-of-light${operator === logical.and.key ? ' active' : ''}`}
                  onClick={() => onChange(R.assoc('operator', logical.and.key, node))}>
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

      <ExpressionNode {...props}
                      node={right}
                      canDelete={true}
                      onChange={item => onChange(R.assoc('right', item, node))}
                      onDelete={() => onChange(left)}/>
    </div>
  )
}

const BinaryOperand = ({ type, node, ...props }) => {
  const { isBoolean, onChange } = props
  const nodeOperand = R.prop(type, node)

  return (
    <React.Fragment>
      <button
        className={`btn btn-s btn-of-light btn-switch-operand${Expression.isIdentifier(nodeOperand) ? ' active' : ''}`}
        onClick={() => onChange(
          R.assoc(type, Expression.newIdentifier(), node)
        )}>
        Var
      </button>
      <button
        className={`btn btn-s btn-of-light btn-switch-operand${Expression.isLiteral(nodeOperand) ? ' active' : ''}`}
        aria-disabled={type === 'left' && isBoolean}
        onClick={() => onChange(
          R.assoc(type, Expression.newLiteral(), node)
        )}>
        Const
      </button>

      <ExpressionNode {...props} node={nodeOperand}
                      onChange={item => onChange(R.assoc(type, item, node))}/>
    </React.Fragment>
  )
}

const Binary = (props) => {
  const {
    node, onChange,
    canDelete = false, onDelete,
    isBoolean
  } = props

  const isLeftIdentifier = R.pipe(
    R.prop('left'),
    Expression.isIdentifier
  )(node)

  return (
    <div className="binary">

      <BinaryOperand {...props} type="left"/>

      {
        isLeftIdentifier &&
        <React.Fragment>


          <Dropdown items={Expression.operators.binaryValues} inputSize={10}
                    selection={Expression.operators.findBinary(node.operator)}
                    onChange={item => onChange(
                      R.assoc('operator', R.propOr('', 'key', item), node)
                    )}/>

          <BinaryOperand {...props} type="right"/>

          {
            isBoolean &&
            <EditButtons node={node} onChange={onChange}
                         onDelete={onDelete} canDelete={canDelete}/>
          }
        </React.Fragment>
      }

    </div>
  )
}

const Identifier = ({ node, variables, onChange }) => (
  <Dropdown items={variables}
            selection={R.find(R.propEq('value', node.name), variables)}
            itemLabelProp="label" itemKeyProp="value"
            inputSize={25}
            onChange={item => onChange(
              R.assoc('name', R.propOr('', 'value', item), node)
            )}/>
)

const Member = ({ node, variables, onChange }) => {
  const nodeIdentifier = {
    type: Expression.types.Identifier,
    name: Expression.toString(node)
  }

  return (
    <Identifier node={nodeIdentifier}
                variables={variables}
                onChange={onChange}/>
  )
}

const Call = ({ node, variables, onChange }) => {
  const nodeIdentifier = {
    type: Expression.types.Identifier,
    name: Expression.toString(node)
  }

  return (
    <Identifier node={nodeIdentifier}
                variables={variables}
                onChange={onChange}/>
  )
}

class Literal extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      selection: null,
      items: null
    }
  }

  async componentDidMount () {
    const { literalSearchParams, node } = this.props
    if (literalSearchParams) {
      this.setState({
        selection: await this.loadItem(node.raw),
        items: await this.loadItems()
      })
    }
  }

  async loadItem (value) {
    const { literalSearchParams } = this.props

    if (value) {
      const params = {
        ...literalSearchParams,
        value
      }
      const { data } = await axios.get('/api/expression/literal/item', { params })

      return data.item
    } else {
      return null
    }
  }

  async loadItems (value = '') {
    const { literalSearchParams } = this.props

    const params = {
      ...literalSearchParams,
      value
    }
    const { data } = await axios.get('/api/expression/literal/items', { params })
    return data.items
  }

  onChange (value) {
    const { node, onChange } = this.props

    onChange(R.pipe(
      R.assoc('raw', value),
      R.assoc('value', value),
    )(node))
  }

  render () {
    const { node, literalSearchParams } = this.props
    const { items, selection } = this.state

    const lookupFunction = async value => this.loadItems(value)

    return (
      <div className="literal">

        {
          literalSearchParams
            ? (
              <Dropdown items={items}
                        itemsLookupFunction={lookupFunction}
                        itemKeyProp="key"
                        itemLabelProp="label"
                        onChange={item => this.onChange(item.key)}
                        selection={selection}/>
            )
            : (
              <input className="form-input" value={node.raw}
                     size={25}
                     onChange={e => this.onChange(e.target.value)}/>
            )
        }

      </div>
    )
  }
}

Literal.defaultProps = {
  literalSearchParams: null
}

const components = {
  [Expression.types.Identifier]: Identifier,
  [Expression.types.MemberExpression]: Member,
  [Expression.types.Literal]: Literal,
  // [Expression.types.ThisExpression]: thisExpression,
  [Expression.types.CallExpression]: Call,
  // [Expression.types.UnaryExpression]: unaryExpression,
  [Expression.types.BinaryExpression]: Binary,
  [Expression.types.LogicalExpression]: Logical,
  [Expression.types.GroupExpression]: Group,
}

export const ExpressionNode = (props) => {
  const component = components[R.path(['node', 'type'], props)]
  return React.createElement(component, props)
}




