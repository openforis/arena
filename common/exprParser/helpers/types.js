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

module.exports = {
  types
}