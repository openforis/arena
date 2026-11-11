import { ValidatorErrorKeys } from '@core/validation/_validator/validatorErrorKeys'

// SQL expressions of custom aggregate functions are checked against allow-lists and rebuilt from their tokens:
// columns are always double quoted, so that no column name can act as a SQL keyword or function.

const errorKeys = ValidatorErrorKeys.aggregateFunction

const keywords = new Set([
  'and',
  'asc',
  'between',
  'by',
  'case',
  'desc',
  'distinct',
  'else',
  'end',
  'false',
  'filter',
  'group',
  'ilike',
  'in',
  'is',
  'like',
  'not',
  'null',
  'or',
  'order',
  'then',
  'true',
  'when',
  'where',
  'within',
])

const functions = new Set([
  // aggregate functions (median is defined by Arena in the public schema)
  'avg',
  'bool_and',
  'bool_or',
  'corr',
  'count',
  'covar_pop',
  'covar_samp',
  'max',
  'median',
  'min',
  'mode',
  'percentile_cont',
  'percentile_disc',
  'stddev',
  'stddev_pop',
  'stddev_samp',
  'sum',
  'var_pop',
  'var_samp',
  'variance',
  // scalar functions
  'abs',
  'ceil',
  'ceiling',
  'coalesce',
  'exp',
  'floor',
  'greatest',
  'least',
  'ln',
  'log',
  'log10',
  'mod',
  'nullif',
  'power',
  'round',
  'sign',
  'sqrt',
  'trunc',
])

const castTypes = new Set([
  'bigint',
  'boolean',
  'date',
  'decimal',
  'float',
  'int',
  'integer',
  'numeric',
  'real',
  'text',
])

type TokenType = 'space' | 'number' | 'word' | 'string' | 'quotedIdentifier' | 'operator'

interface Token {
  type: TokenType
  text: string
}

export interface AggregateFunctionExpressionError {
  key: string
  params?: Record<string, unknown>
}

class InvalidExpressionError extends Error {
  readonly error: AggregateFunctionExpressionError

  constructor(key: string, params?: Record<string, unknown>) {
    super(key)
    this.error = { key, params }
  }
}

/**
 * Stops the conversion of the expression with the specified error.
 * @param {string} key - The validation error key.
 * @param {object} [params] - The validation error params.
 * @returns {never} - It always throws an error.
 */
const fail = (key: string, params?: Record<string, unknown>): never => {
  throw new InvalidExpressionError(key, params)
}

// sticky regular expressions, tried in this order at the current position
const tokenRegExps: { type: TokenType; regExp: RegExp }[] = [
  { type: 'space', regExp: /\s+/y },
  // a number cannot be followed by letters, digits, underscores or dots (e.g. 0x1F, 1_000, 1.2.3)
  { type: 'number', regExp: /(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?![\w.])/iy },
  { type: 'word', regExp: /[a-z_]\w*/iy },
  // standard strings only: quotes escaped by doubling them (backslashes are rejected before tokenizing)
  { type: 'string', regExp: /'(?:[^']|'')*'/y },
  { type: 'quotedIdentifier', regExp: /"(?:[^"]|"")+"/y },
  { type: 'operator', regExp: /::|<=|>=|<>|!=|[-+*/%^=<>(),]/y },
]

const commentRegExp = /--|\/\*/y

/**
 * Returns the token starting at the specified position of the expression.
 * @param {string} expression - The SQL expression.
 * @param {number} position - The start position.
 * @returns {Token} - The token found.
 */
const matchToken = (expression: string, position: number): Token => {
  for (const { type, regExp } of tokenRegExps) {
    regExp.lastIndex = position
    const match = regExp.exec(expression)
    if (match) return { type, text: match[0] }
  }
  const char = expression.charAt(position)
  return char === `'` || char === '"'
    ? fail(errorKeys.expressionUnterminatedQuote)
    : fail(errorKeys.expressionInvalid, { text: char })
}

/**
 * Splits the expression into tokens, failing on anything that is not an allowed token.
 * @param {string} expression - The SQL expression.
 * @returns {Token[]} - The tokens (spaces excluded).
 */
const tokenize = (expression: string): Token[] => {
  // never needed: backslashes (escape strings) and dollar signs (dollar quoting, query parameters,
  // replaced by pg-promise even inside strings)
  const forbiddenChar = /[\\$]/.exec(expression)?.[0]
  if (forbiddenChar) fail(errorKeys.expressionInvalid, { text: forbiddenChar })

  const tokens: Token[] = []
  let position = 0
  while (position < expression.length) {
    commentRegExp.lastIndex = position
    if (commentRegExp.test(expression)) {
      fail(errorKeys.expressionInvalid, { text: expression.slice(position, position + 2) })
    }

    const token = matchToken(expression, position)
    if (token.type !== 'space') tokens.push(token)
    position += token.text.length
  }
  return tokens
}

/**
 * Converts a column name into a double quoted SQL identifier.
 * @param {string} name - The column name.
 * @returns {string} - The quoted identifier.
 */
const quoteIdentifier = (name: string): string => `"${name.replaceAll('"', '""')}"`

/**
 * Converts a column reference into SQL; a column cannot be followed by an opening parenthesis (function call)
 * or by a string (type name followed by a literal).
 * @param {object} params - The parameters.
 * @param {string} params.name - The column name.
 * @param {Token} [params.next] - The token following the column.
 * @param {Set<string>} params.columnNames - The allowed column names.
 * @returns {string} - The column as a quoted SQL identifier.
 */
const columnToSql = ({ name, next, columnNames }: { name: string; next?: Token; columnNames: Set<string> }): string => {
  if (next?.text === '(') fail(errorKeys.expressionFunctionNotAllowed, { name })
  if (!columnNames.has(name)) fail(errorKeys.expressionUnknownColumn, { name })
  if (next?.type === 'string') fail(errorKeys.expressionInvalid, { text: next.text })
  return quoteIdentifier(name)
}

/**
 * Converts a word (keyword, function name or column) into SQL.
 * @param {object} params - The parameters.
 * @param {Token} params.token - The word token.
 * @param {Token} [params.next] - The token following the word.
 * @param {Set<string>} params.columnNames - The allowed column names.
 * @returns {string} - The word converted into SQL.
 */
const wordToSql = ({ token, next, columnNames }: { token: Token; next?: Token; columnNames: Set<string> }): string => {
  // unquoted identifiers are case insensitive in PostgreSQL
  const word = token.text.toLowerCase()
  if (keywords.has(word)) return word.toUpperCase()
  if (next?.text === '(') {
    return functions.has(word) ? word : fail(errorKeys.expressionFunctionNotAllowed, { name: token.text })
  }
  return columnToSql({ name: word, next, columnNames })
}

/**
 * Converts the type of a cast (::type) into SQL.
 * @param {Token[]} tokens - The expression tokens.
 * @param {number} index - The index of the token following the cast operator.
 * @returns {{sql: string, length: number}} - The type in SQL and the number of tokens it takes.
 */
const castTypeToSql = (tokens: Token[], index: number): { sql: string; length: number } => {
  const [type, nextType] = tokens.slice(index, index + 2).map((token) => token.text.toLowerCase())
  if (type === 'double' && nextType === 'precision') return { sql: 'double precision', length: 2 }
  if (castTypes.has(type)) return { sql: type, length: 1 }
  return fail(errorKeys.expressionInvalid, { text: `::${tokens[index]?.text ?? ''}` })
}

/**
 * Checks that the parentheses are balanced, so that the expression cannot close the ones it is wrapped into.
 * @param {Token[]} tokens - The expression tokens.
 * @returns {void}
 */
const checkParentheses = (tokens: Token[]): void => {
  let depth = 0
  for (const { type, text } of tokens) {
    if (type === 'operator' && text === '(') depth += 1
    if (type === 'operator' && text === ')') depth -= 1
    if (depth < 0) fail(errorKeys.expressionUnbalancedParentheses)
  }
  if (depth !== 0) fail(errorKeys.expressionUnbalancedParentheses)
}

/**
 * Converts the tokens into SQL.
 * @param {Token[]} tokens - The expression tokens.
 * @param {Set<string>} columnNames - The allowed column names.
 * @returns {string[]} - The SQL parts.
 */
const tokensToSql = (tokens: Token[], columnNames: Set<string>): string[] => {
  const parts: string[] = []
  let index = 0
  while (index < tokens.length) {
    const token = tokens[index]
    const next = tokens[index + 1]
    index += 1
    if (token.type === 'word') {
      parts.push(wordToSql({ token, next, columnNames }))
    } else if (token.type === 'quotedIdentifier') {
      const name = token.text.slice(1, -1).replaceAll('""', '"')
      parts.push(columnToSql({ name, next, columnNames }))
    } else if (token.text === '::') {
      const { sql, length } = castTypeToSql(tokens, index)
      parts.push(`::${sql}`)
      index += length
    } else {
      // numbers, strings (already escaped) and operators
      parts.push(token.text)
    }
  }
  return parts
}

/**
 * Converts the SQL expression of a custom aggregate function into the SQL to run, rebuilt from its allowed tokens.
 * @param {object} params - The parameters.
 * @param {string} params.expression - The SQL expression.
 * @param {Iterable<string>} params.columnNames - The column names of the entity data view that can be used.
 * @returns {string} - The SQL to use in the select clause.
 * @throws {InvalidExpressionError} - When the expression contains something not allowed.
 */
const toSql = ({ expression, columnNames }: { expression: string; columnNames: Iterable<string> }): string => {
  const tokens = tokenize(String(expression ?? ''))
  if (tokens.length === 0) fail(errorKeys.expressionRequired)
  checkParentheses(tokens)
  return tokensToSql(tokens, new Set(columnNames)).join(' ')
}

/**
 * Validates the SQL expression of a custom aggregate function.
 * @param {object} params - The parameters.
 * @param {string} params.expression - The SQL expression.
 * @param {Iterable<string>} params.columnNames - The column names of the entity data view that can be used.
 * @returns {AggregateFunctionExpressionError|null} - The first error found or null if the expression is valid.
 */
const validate = ({
  expression,
  columnNames,
}: {
  expression: string
  columnNames: Iterable<string>
}): AggregateFunctionExpressionError | null => {
  try {
    toSql({ expression, columnNames })
    return null
  } catch (error) {
    if (error instanceof InvalidExpressionError) return error.error
    throw error
  }
}

export const AggregateFunctionExpression = {
  toSql,
  validate,
}
