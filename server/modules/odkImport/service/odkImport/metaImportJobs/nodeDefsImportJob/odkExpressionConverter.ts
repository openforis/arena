import * as Expression from '@core/expressionParser/expression'
import * as NodeDef from '@core/survey/nodeDef'
import * as NodeDefExpressionValidator from '@core/survey/nodeDefExpressionValidator'

export interface XFormNodeDefPathIndex {
  get(path: string): any
}

/**
 * Resolves a (possibly relative) XForm path into an absolute one, the same way XPath itself would:
 * the context node for a relative path is the bound node itself (currentXFormPath, leaf included) -
 * one leading "../" moves to *its* parent, i.e. strips currentXFormPath's own last segment first.
 */
const resolveAbsoluteXFormPath = (rawPath: string, currentXFormPath: string): string => {
  if (rawPath.startsWith('/')) return rawPath

  let baseParts = currentXFormPath.split('/').filter(Boolean)
  let rest = rawPath

  while (rest === '..' || rest.startsWith('../')) {
    baseParts = baseParts.slice(0, -1)
    rest = rest === '..' ? '' : rest.slice(3)
  }
  if (rest.startsWith('./')) rest = rest.slice(2)

  const restParts = rest ? rest.split('/').filter(Boolean) : []
  return `/${[...baseParts, ...restParts].join('/')}`
}

/**
 * Resolves an XForm path reference (absolute "/data/group/field", relative "../field"/".."/"."/
 * "../../field") into an Arena expression reference. Arena's own expression syntax (confirmed via
 * collectExpressionConverter.js's test fixtures, e.g. `parent()/remarks` -> `cluster.remarks`) uses a
 * bare name for a same-entity sibling, or a dot-joined ancestor-relative chain - starting from the
 * shared ancestor entity itself - for a reference that crosses out of the current entity.
 *
 * Computed as: find the longest path prefix the target shares with the *current node's own parent*
 * (its evaluation context). If the whole of that parent path is shared (same-entity reference), name
 * every remaining segment from the divergence point down to the target. Otherwise (crossing out of the
 * current entity into an ancestor's), the divergence point itself is the shared ancestor entity - name
 * it too, then every segment down to the target - matching Collect's `parent()/x` -> `ancestor.x`
 * convention. An entity partway through either chain resolves to its own Arena name just like the leaf
 * does, since every instance-tree node - entity or attribute - was inserted into `nodeDefsByXFormPath`
 * during the walk.
 * @param params - Function parameters.
 * @param params.rawPath - The raw XForm path token (e.g. '../other_field', '/data/group/field', '.').
 * @param params.currentXFormPath - The XForm path of the node def whose expression is being converted.
 * @param params.nodeDefsByXFormPath - Path -> already-inserted Arena NodeDef, built during the NodeDefs walk.
 * @returns The resolved Arena expression reference (a bare name or a dotted chain), or null if any
 *   segment along the way can't be resolved.
 */
const resolveXFormPathToArenaExpression = ({
  rawPath,
  currentXFormPath,
  nodeDefsByXFormPath,
}: {
  rawPath: string
  currentXFormPath: string
  nodeDefsByXFormPath: XFormNodeDefPathIndex
}): string | null => {
  const absoluteTargetPath = resolveAbsoluteXFormPath(rawPath, currentXFormPath)
  const targetSegments = absoluteTargetPath.split('/').filter(Boolean)
  const currentParentSegments = currentXFormPath.split('/').filter(Boolean).slice(0, -1)

  let commonPrefixLength = 0
  while (
    commonPrefixLength < targetSegments.length &&
    commonPrefixLength < currentParentSegments.length &&
    targetSegments[commonPrefixLength] === currentParentSegments[commonPrefixLength]
  ) {
    commonPrefixLength += 1
  }

  const crossesOutOfCurrentEntity = commonPrefixLength < currentParentSegments.length
  const startIndex = crossesOutOfCurrentEntity ? Math.max(commonPrefixLength - 1, 0) : commonPrefixLength

  const names: string[] = []
  for (let i = startIndex; i < targetSegments.length; i += 1) {
    const cumulativePath = `/${targetSegments.slice(0, i + 1).join('/')}`
    const nodeDef = nodeDefsByXFormPath.get(cumulativePath)
    if (!nodeDef) return null
    names.push(NodeDef.getName(nodeDef))
  }
  return names.length > 0 ? names.join('.') : null
}

// Negative lookbehind excludes a "/" that's actually part of a longer relative path (e.g. the
// "/plot_remarks" tail of "../plot_details/plot_remarks") - a genuine absolute path is never preceded
// by a word character, ".", or another "/".
const ABSOLUTE_PATH_PATTERN = /(?<![.\w/])\/[A-Za-z_]\w*(?:\/[A-Za-z_]\w*)+/g
// Consumes every "/segment" after the leading dots, not just one, so "../a/b/c" converts as a whole.
const RELATIVE_DOTS_PATH_PATTERN = /\.\.(?:\/\.\.)*(?:\/[A-Za-z_]\w*)*/g
const SELF_REFERENCE_PATTERN = /(?<![\w.])\.(?![\w.(])/g
// The path-argument group is greedy with no adjacent optional-whitespace boundary (leading/trailing
// whitespace inside it is trimmed at the call site instead) - avoids the overlapping-quantifier
// backtracking blowup an equivalent `\s*([^,]+?)\s*,` shape has, since both `\s` and `[^,]` can match
// the same whitespace character.
const SELECTED_CALL_PATTERN = /\bselected\(([^,]+),\s*((?:'[^']*')|(?:"[^"]*"))\s*\)/g

/**
 * Converts an ODK/XForm `relevant`/`constraint`/`calculate`/`required` XPath expression into a valid
 * Arena expression, regex-transpiler style (same approach as collectExpressionConverter.js, not a
 * full XPath parser - ODK's function vocabulary in `relevant`/`constraint`/`calculate` is small and
 * well-known in practice). Every conversion is validated via NodeDefExpressionValidator before being
 * accepted; an unconvertible expression returns null rather than a guessed, possibly-wrong result -
 * the caller logs every attempt (success or failure) as an import-report item and never blocks the
 * import on a failed conversion.
 *
 * Deliberately NOT attempted: XForm's `if(cond, a, b)` has no conversion here - Arena's expression
 * validator rejects conditional (ternary) expressions outright (`expression.notSupported`, confirmed
 * against the real validator, not assumed), so an `if()` call is always left unconverted/flagged rather
 * than producing a ternary that's guaranteed to fail validation.
 * @param params - Function parameters.
 * @param params.survey - The (in-progress) Arena survey.
 * @param params.nodeDefCurrent - The Arena NodeDef whose expression is being converted.
 * @param params.currentXFormPath - The XForm path of that same node (for relative path resolution).
 * @param params.nodeDefsByXFormPath - Path -> already-inserted Arena NodeDef, built during the walk.
 * @param params.expression - The raw XForm XPath expression.
 * @returns The converted, validated expression, or null if it couldn't be converted.
 */
const convert = async ({
  survey,
  nodeDefCurrent,
  currentXFormPath,
  nodeDefsByXFormPath,
  expression,
}: {
  survey: any
  nodeDefCurrent: any
  currentXFormPath: string
  nodeDefsByXFormPath: XFormNodeDefPathIndex
  expression: string
}): Promise<string | null> => {
  let unresolvedPath = false

  const resolvePathToken = (rawPath: string): string => {
    if (rawPath === '.') return Expression.thisVariable // e.g. selected(., 'x') - self isn't a real path
    const resolved = resolveXFormPathToArenaExpression({ rawPath, currentXFormPath, nodeDefsByXFormPath })
    if (!resolved) {
      unresolvedPath = true
      return rawPath
    }
    return resolved
  }

  const converted = expression
    .replaceAll('\n', ' ')
    .trim()
    // selected(x, 'v') -> includes(<resolved x>, 'v') - must run before generic path resolution,
    // since its first argument is itself a path token
    .replace(
      SELECTED_CALL_PATTERN,
      (_match, pathArg, valueArg) => `includes(${resolvePathToken(pathArg.trim())}, ${valueArg})`
    )
    // relative dot-paths ("../field", "..", "../../a/b") before absolute ones, so a trailing "/x/y" on
    // a relative path is consumed here first and never mistaken for a stand-alone absolute path
    .replace(RELATIVE_DOTS_PATH_PATTERN, (match) => resolvePathToken(match))
    // absolute paths ("/data/group/field")
    .replace(ABSOLUTE_PATH_PATTERN, (match) => resolvePathToken(match))
    // self-reference: lone "." (not ".." or part of a decimal number) -> Arena's `this`
    .replace(SELF_REFERENCE_PATTERN, Expression.thisVariable)

  if (unresolvedPath) return null
  if (/\bif\s*\(/.test(converted)) return null // see the "Deliberately NOT attempted" note above

  const normalized = converted
    // equality operator, but not <=, >=, !=, == (already valid)
    .replace(/(?<![<>=!])=(?!=)/g, '==')
    .replace(/\band\b/gi, '&&')
    .replace(/\bor\b/gi, '||')
    .replace(/\bnot\(/g, '!(')
    .replace(/\btrue\(\)/gi, 'true')
    .replace(/\bfalse\(\)/gi, 'false')
    .replace(/\btoday\(\)/g, 'now()')
    .replace(/\s+/g, ' ')
    .trim()
    .concat('\n') // ready for the "advanced" expression editor, same convention as Collect's converter

  const validationResult = await NodeDefExpressionValidator.validate({
    survey,
    nodeDefCurrent,
    exprString: normalized,
    isContextParent: true,
    selfReferenceAllowed: true,
  })

  return validationResult ? null : normalized
}

export const OdkExpressionConverter = {
  convert,
}
