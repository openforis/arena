const R = require('ramda')

const {trim, isNotBlank} = require('../../stringUtils')

const types = {
  // 'Compound'
  Identifier: 'Identifier',
  MemberExpression: 'MemberExpression',
  Literal: 'Literal',
  ThisExpression: 'ThisExpression',
  CallExpression: 'CallExpression',
  UnaryExpression: 'UnaryExpression',
  BinaryExpression: 'BinaryExpression',
  LogicalExpression: 'LogicalExpression',
  // 'ConditionalExpression'
  // 'ArrayExpression'
  // custom - not managed by jsep
  GroupExpression: 'GroupExpression',
}

// toString
const binaryToString = node => `${toString(node.left)} ${node.operator} ${toString(node.right)}`

// valid
const propValid = prop => R.pipe(R.prop(prop), isNotBlank)
const binaryValid = node => isValid(node.left) && propValid('operator')(node) && isValid(node.right)

const typeProps = {
  [types.Identifier]: {
    toString: R.prop('name'),
    isValid: propValid('name'),
  },
  [types.MemberExpression]: {
    // toString: TODO,
    // isValid: TODO,
  },
  [types.Literal]: {
    toString: R.prop('raw'),
    isValid: propValid('raw'),
  },
  [types.ThisExpression]: {
    toString: () => 'this',
    isValid: () => true,
  },
  [types.CallExpression]: {
    // toString: TODO,
    // isValid: TODO,
  },
  [types.UnaryExpression]: {
    toString: node => `${node.operator} ${toString(node.argument)}`,
    isValid: node => propValid('operator')(node) && isValid(node.argument),
  },
  [types.BinaryExpression]: {
    toString: binaryToString,
    isValid: binaryValid,
  },
  [types.LogicalExpression]: {
    toString: binaryToString,
    isValid: binaryValid,
  },
  [types.GroupExpression]: {
    toString: node => `(${toString(node.argument)})`,
    isValid: node => isValid(node.argument),
  },
}

const getTypeProp = (type, prop) => R.path([type, prop], typeProps)

const toString = expr => trim(
  getTypeProp(expr.type, 'toString')(expr)
)

const isValid = expr =>
  getTypeProp(expr.type, 'isValid')(expr)


module.exports = {
  types,

  toString,
  isValid,
}