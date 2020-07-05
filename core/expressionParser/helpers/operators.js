import * as R from 'ramda'

const logical = {
  and: { key: '&&', value: '&&' },
  or: { key: '||', value: '||' },
}

const comparison = {
  eq: { key: '==', value: '=' },
  notEq: { key: '!=', value: '!=' },
  gt: { key: '>', value: '>' },
  less: { key: '<', value: '<' },
  gtOrEq: { key: '>=', value: '>=' },
  lessOrEq: { key: '<=', value: '<=' },
}

const arithmetic = {
  add: { key: '+', value: '+' },
  sub: { key: '-', value: '-' },
  mul: { key: '*', value: '*' },
  div: { key: '/', value: '/' },
  mod: { key: '%', value: '%' },
}

const binary = R.mergeLeft(arithmetic, comparison)
const binaryValues = R.values(binary)

const findBinary = (operator) => R.find(R.propEq('key', operator), binaryValues)

const js2sqlOperators = {
  '&&': 'AND',
  '||': 'OR',
  // IS (NOT) DISTINCT FROM always returns true/false, even for nulls
  '==': 'IS NOT DISTINCT FROM',
  '!=': 'IS DISTINCT FROM',
  '>': '>',
  '<': '<',
  '>=': '>=',
  '<=': '<=',
  '+': '+',
  '-': '-',
  '*': '*',
  '/': '/',
  '%': '%',
}

export const operators = {
  logical,
  comparison,
  arithmetic,
  binary,
  binaryValues,
  findBinary,
  js2sqlOperators,
}
