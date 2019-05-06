const R = require('ramda')

const { trim, isNotBlank } = require('../../stringUtils')
const { types } = require('../types')

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
    toString: node => `${toString(node.object)}.${toString(node.property)}`,
    isValid: node => isValid(node.object) && isValid(node.property),
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
    toString: node => `${toString(node.callee)}(${node.arguments.map(toString).join(',')})`,
    isValid: node => isValid((node.callee)),
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
  toString,
  isValid,
}