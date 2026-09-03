// Best-effort, regex-based extraction of a function call's first two arguments from an expression -
// NOT a full parse (mirrors the same "good enough" philosophy as userDependentFunctionsRegExp in
// core/survey/nodeDef.js, just capturing what's inside the parens too). Sufficient to recognize calls
// like categoryItemProp('categoryName', 'propName', ...) / taxonProp('taxonomyName', 'propName', ...),
// which is how Arena's expression builder always authors them (literal name arguments).

// Splits a raw argument-list substring (the text between a call's outer parens) into its top-level
// comma-separated pieces, tracking quote state and paren nesting depth so that commas/parens inside a
// string literal or a nested call don't cause a false split.
const splitTopLevelArgs = (argsText: string): string[] => {
  const args: string[] = []
  let current = ''
  let depth = 0
  let quoteChar: string | null = null

  for (let i = 0; i < argsText.length; i++) {
    const char = argsText[i]

    if (quoteChar) {
      current += char
      if (char === '\\') {
        // keep the escape and its following character together, whatever it is
        i++
        if (i < argsText.length) current += argsText[i]
      } else if (char === quoteChar) {
        quoteChar = null
      }
      continue
    }

    if (char === "'" || char === '"') {
      quoteChar = char
      current += char
    } else if (char === '(' || char === '[') {
      depth++
      current += char
    } else if (char === ')' || char === ']') {
      depth--
      current += char
    } else if (char === ',' && depth === 0) {
      args.push(current)
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim().length > 0 || args.length > 0) {
    args.push(current)
  }
  return args
}

const STRING_LITERAL_REGEX = /^\s*(?:'((?:\\.|[^'\\])*)'|"((?:\\.|[^"\\])*)")\s*$/

// Returns the literal string value of an argument if it's a plain single/double-quoted string
// literal, or null if it's anything else (identifier, member expression, nested call, number,
// concatenation...) - null means "unknown", not "no match", to callers that scan for it.
const parseStringLiteral = (arg: string): string | null => {
  const match = arg.match(STRING_LITERAL_REGEX)
  if (!match) return null
  const raw = match[1] ?? match[2] ?? ''
  return raw.replace(/\\(.)/g, '$1')
}

// Finds every call to `functionName(...)` in `expression` and returns, for each occurrence, its first
// two arguments as [arg1, arg2], each either the argument's literal string value (if it is a quoted
// string literal) or null otherwise.
export const extractCallFirstTwoArgs = (expression: string, functionName: string): (string | null)[][] => {
  const calls: (string | null)[][] = []
  if (!expression) return calls

  const callStartRegex = new RegExp(String.raw`\b${functionName}\s*\(`, 'g')
  let startMatch: RegExpExecArray | null

  while ((startMatch = callStartRegex.exec(expression))) {
    const argsStart = startMatch.index + startMatch[0].length
    // find the matching closing paren for this call, tracking nested parens/brackets and quotes
    let depth = 1
    let quoteChar: string | null = null
    let i = argsStart
    for (; i < expression.length && depth > 0; i++) {
      const char = expression[i]
      if (quoteChar) {
        if (char === '\\') {
          i++
        } else if (char === quoteChar) {
          quoteChar = null
        }
        continue
      }
      if (char === "'" || char === '"') {
        quoteChar = char
      } else if (char === '(' || char === '[') {
        depth++
      } else if (char === ')' || char === ']') {
        depth--
      }
    }
    const argsText = expression.substring(argsStart, depth === 0 ? i - 1 : i)
    const rawArgs = splitTopLevelArgs(argsText)
    calls.push([parseStringLiteral(rawArgs[0] ?? ''), parseStringLiteral(rawArgs[1] ?? '')])
    callStartRegex.lastIndex = i
  }
  return calls
}
