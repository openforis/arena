import * as R from 'ramda';
import jsep from './helpers/jsep';
import { evalExpression } from './helpers/evaluator';
import { toString as toStringUtils, isValid } from './helpers/utils';
import { types } from './helpers/types';
import operators from './helpers/operators';

interface ICallExpression {
  type: 'CallExpression',
  arguments: any[],
  callee: {
    type: 'MemberExpression',
    computed: false,
    object: [Object],
    property: [Object]
  }
}
interface ILiteralExpression {
  type: 'Literal';
  value: any;
  raw: string;
}
type JSEPOperand = ICallExpression | ILiteralExpression

export interface IJSEPExpression {
  type: string; // 'BinaryExpression',
  operator: string; // '>',
  left: JSEPOperand;
  right: JSEPOperand;
}

export const modes = {
  json: 'json',
  sql: 'sql',
}

export const toString = (expr, exprMode = modes.json) => {
  const string = toStringUtils(expr)

  return exprMode === modes.sql
    ? R.pipe(
      R.replace(/&&/g, 'AND'),
      R.replace(/\|\|/g, 'OR'),
      R.replace(/===/g, '='),
      R.replace(/!==/g, '!='),
    )(string)
    : string
}

export const fromString: (string: string, exprMode?: string) => IJSEPExpression
= (string: string, exprMode = modes.json) => {
  const exprString = exprMode === modes.json ?
    string :
    R.pipe(
      R.replace(/AND/g, '&&'),
      R.replace(/OR/g, '||'),
      R.replace(/=/g, '==='),
      R.replace(/!===/g, '!=='),
      R.replace(/>===/g, '>='),
      R.replace(/<===/g, '<='),
    )(string)

  return jsep(exprString)
}

export const evalString = async (query, ctx) =>
  await evalExpression(fromString(query), ctx)

// ====== Type checking

export const isType = type => R.propEq('type', type)

// ====== Instance creators


export interface ILiteral {
  type: string;
  value: any;
  raw: any | string;
}
export interface IIdentifier {
  type: string;
  name: any;
}
export interface IBinary {
  type: string;
  operator: string;
  left: any;
  right: any;
}

export const newLiteral: (value?: any) => ILiteral = (value = null) => ({
  type: types.Literal,
  value: value,
  raw: value || '',
})

export const newIdentifier: (value?: any) => IIdentifier = (value = '') => ({
  type: types.Identifier,
  name: value,
})

export const newBinary: (left: any, right: any, operator?: string) => IBinary
= (left, right, operator = '') => ({
  type: types.BinaryExpression,
  operator,
  left,
  right,
})

export { types };

export default {
  types,
  modes,

  toString,
  fromString,
  evalString,
  isValid,

  // Type checking
  isLiteral: isType(types.Literal),
  isCompound: isType(types.Compound),
  isBinary: isType(types.BinaryExpression),
  isIdentifier: isType(types.Identifier),
  isLogical: isType(types.LogicalExpression),

  // Instance creators
  newLiteral,
  newIdentifier,
  newBinary,

  // operators
  operators,
};
