// AST-based extraction of a function call's first two arguments from an expression. Parses the
// expression with the same JS expression parser used to evaluate node def expressions, then walks
// the resulting AST looking for `functionName(...)` calls - correctly handling nesting, escaping and
// whitespace that a regex-based scan could only approximate. Used to recognize calls like
// categoryItemProp('categoryName', 'propName', ...) / taxonProp('taxonomyName', 'propName', ...),
// which is how Arena's expression builder always authors them (literal name arguments).
//
// Imports the parser directly from arena-core (rather than going through
// `@core/expressionParser/expression`, which itself imports `@core/survey/nodeDef`) to avoid a
// circular import, since this module is used from `@core/survey/nodeDef`.
import { JavascriptExpressionParser } from '@openforis/arena-core'

interface AstNode {
  type: string
  [key: string]: unknown
}

const parser = new JavascriptExpressionParser()

// Recursively walks the parsed expression AST collecting every CallExpression node whose callee is a
// plain identifier matching `functionName`. Calls can appear anywhere in the tree (inside a binary
// operand, another call's arguments, a member expression object...), so the walk visits every
// property of every node rather than special-casing specific node shapes.
const collectMatchingCalls = (node: unknown, functionName: string, calls: AstNode[]): void => {
  if (!node || typeof node !== 'object') return

  if (Array.isArray(node)) {
    node.forEach((child) => collectMatchingCalls(child, functionName, calls))
    return
  }

  const astNode = node as AstNode

  if (astNode.type === 'CallExpression') {
    const callee = astNode.callee as AstNode | undefined
    if (callee?.type === 'Identifier' && callee.name === functionName) {
      calls.push(astNode)
    }
  }

  Object.values(astNode).forEach((value) => collectMatchingCalls(value, functionName, calls))
}

// Returns the literal string value of an argument node if it's a string literal, or null for
// anything else (identifier, member expression, nested call, number...) - null means "unknown", not
// "no match", to callers that scan for it.
const literalStringValue = (argNode: AstNode | undefined): string | null => {
  if (argNode?.type !== 'Literal') return null
  const { value } = argNode
  return typeof value === 'string' ? value : null
}

// Finds every call to `functionName(...)` in `expression` and returns, for each occurrence, its first
// two arguments as [arg1, arg2], each either the argument's literal string value (if it is a string
// literal) or null otherwise.
export const extractCallFirstTwoArgs = (expression: string, functionName: string): (string | null)[][] => {
  if (!expression) return []

  let root: unknown
  try {
    root = parser.parse(expression)
  } catch {
    // not a parseable expression - nothing to extract (callers treat "no calls found" as safe)
    return []
  }

  const calls: AstNode[] = []
  collectMatchingCalls(root, functionName, calls)

  return calls.map((call) => {
    const args = (call.arguments as AstNode[] | undefined) ?? []
    return [literalStringValue(args[0]), literalStringValue(args[1])]
  })
}
