import * as R from 'ramda'

const logical = {
  and: { value: '&&', label: '&&' },
  or: { value: '||', label: '||' },
}

const comparison = {
  eq: { value: '==', label: '=' },
  notEq: { value: '!=', label: '!=' },
  gt: { value: '>', label: '>' },
  less: { value: '<', label: '<' },
  gtOrEq: { value: '>=', label: '>=' },
  lessOrEq: { value: '<=', label: '<=' },
}

const arithmetic = {
  add: { value: '+', label: '+' },
  sub: { value: '-', label: '-' },
  mul: { value: '*', label: '*' },
  div: { value: '/', label: '/' },
  mod: { value: '%', label: '%' },
  exp: { value: '**', label: '**' },
}

const binary = R.mergeLeft(arithmetic, comparison)
const binaryValues = R.values(binary)

const findBinary = (operator) => R.find(R.propEq('value', operator), binaryValues)

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
  '**': '^',
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
