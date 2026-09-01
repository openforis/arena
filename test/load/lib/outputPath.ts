import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

/**
 * Returns whether `resolvedPath` (already absolute) is `root` itself or a descendant of it, using
 * `path.relative` rather than a string-prefix check: `path.relative` is the confinement check
 * static-analysis path-traversal rules (including SonarCloud's) recognize as a real sanitizer, and
 * unlike a bare `startsWith`, it can't be fooled by a sibling directory sharing a name prefix
 * (e.g. root "/repo/checkout" vs. path "/repo/checkout-evil").
 * @param resolvedPath - An already-resolved absolute path to test.
 * @param root - An already-resolved absolute directory to test containment against.
 * @returns True if resolvedPath is root or lies within it.
 */
export const isWithinAllowedRoot = (resolvedPath: string, root: string): boolean => {
  if (resolvedPath === root) return true
  const relative = path.relative(root, resolvedPath)
  return Boolean(relative) && !relative.startsWith('..') && !path.isAbsolute(relative)
}

/**
 * Resolves a CLI-supplied output path and validates it stays within an expected root (the current
 * working directory, or the OS temp directory -- both real usages: local/CI runs writing under the
 * repo, and the CI workflow writing under /tmp) before any filesystem write touches it. Addresses a
 * static-analysis (SonarCloud) path-traversal finding: canonicalizing CLI-controlled input and using
 * it directly in a filesystem sink, with no check that it can't resolve outside an intended directory.
 * @param rawPath - The raw path argument from argv.
 * @param [cwd] - The directory to treat as the current working directory (defaults to process.cwd()).
 * @returns The resolved, validated absolute path.
 */
export const resolveValidatedOutputPath = (rawPath: string, cwd: string = process.cwd()): string => {
  const resolved = path.resolve(cwd, rawPath)
  const allowedRoots = [cwd, fs.realpathSync(os.tmpdir())].map((root) => path.resolve(root))
  const isAllowed = allowedRoots.some((root) => isWithinAllowedRoot(resolved, root))
  if (!isAllowed) {
    throw new Error(
      `Refusing to write outside the current directory or the OS temp directory: ${resolved} ` +
        `(allowed roots: ${allowedRoots.join(', ')})`
    )
  }
  return resolved
}
