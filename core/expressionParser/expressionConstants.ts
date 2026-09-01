export const modes = {
  json: 'json',
  sql: 'sql',
} as const

export type ExpressionMode = (typeof modes)[keyof typeof modes]

export const thisVariable = 'this'

export const contextVariable = '$context'
