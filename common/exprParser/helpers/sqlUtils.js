const R = require('ramda')

const jsep = require('./jsep')
const { types } = require('./types')

const binaryToString = node => `${toString(node.left)} ${node.operator} ${toString(node.right)}`

class LiteralGenerator {
  constructor () {
    this.n = 1
    this.literals = []
  }

  generateVar (raw) {
    const varName = `_${this.n++}`

    this.literals[varName] = raw
    return varName
  }

  getLiterals () {
    return this.literals
  }
}

const literalGenerator = new LiteralGenerator()

const converters = {
  [types.Identifier]: R.prop('name'),
  [types.BinaryExpression]: binaryToString,
  [types.MemberExpression]: node => `${toString(node.object)}.${toString(node.property)}`,
  [types.Literal]: node => '${' + literalGenerator.generateVar(node.raw) + '}',
  // [types.ThisExpression]: () => 'this',
  // [types.CallExpression]: node => `${toString(node.callee)}(${node.arguments.map(toString).join(',')})`,
  [types.UnaryExpression]: node => `${node.operator} ${toString(node.argument)}`,
  [types.LogicalExpression]: binaryToString,
  [types.GroupExpression]: node => `(${toString(node.argument)})`,
}

const toString = expr => converters[expr.type](expr)

const expr = jsep('asdf === 1 && qwer === "qwer"')
console.log(expr)
console.log(toString(expr))
console.log(literalGenerator.getLiterals())

module.exports = {
  converters,
  toPreparedStatement: toString,
}
