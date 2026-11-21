const MIN_COMMON_PREFIX = 3

const commonPrefixLength = (a: string, b: string): number => {
  let length = 0
  while (length < a.length && length < b.length && a[length] === b[length]) length += 1
  return length
}

/**
 * Returns the names closest to one a model guessed: the ones containing it (or contained in it), then the ones
 * starting like it.
 * @param {string} name - The unknown name.
 * @param {string[]} candidates - The valid names.
 * @param {number} [max] - Maximum number of names.
 * @returns {string[]} The closest names, best first.
 */
export const closestNames = (name: string, candidates: string[], max = 3): string[] => {
  const wanted = name.toLowerCase()
  const score = (candidate: string): number => {
    const other = candidate.toLowerCase()
    return other.includes(wanted) || wanted.includes(other) ? Infinity : commonPrefixLength(wanted, other)
  }
  const scored = candidates.map((candidate) => ({ candidate, score: score(candidate) }))
  // names sharing only the prefix of the entity (tree_) are left out when a closer one exists
  const floor = Math.max(MIN_COMMON_PREFIX, Math.max(0, ...scored.map((item) => item.score)) - 2)
  return scored
    .filter((item) => item.score >= floor)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((item) => item.candidate)
}

/**
 * Describes an unknown name with the close valid names, for a tool error.
 * @param {string} name - The unknown name.
 * @param {string[]} candidates - The valid names.
 * @returns {string} E.g. `tree_number (close names: tree_no)`.
 */
export const withClosestNames = (name: string, candidates: string[]): string => {
  const close = closestNames(name, candidates)
  return close.length > 0 ? `${name} (close names: ${close.join(', ')})` : name
}
