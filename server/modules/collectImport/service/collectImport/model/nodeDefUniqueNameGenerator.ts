import * as Validator from '@core/validation/validator'

// a node def name must start with a letter and be at most 40 characters long (see Validator.validateName)
const nameMaxLength = 40
const namePrefixIfNotStartingWithLetter = 'n_'

/**
 * Truncates the name so that, with the suffix appended, it fits the maximum name length.
 * @param {string} name - The name.
 * @param {string} [suffix] - The suffix to append.
 * @returns {string} - The name with the suffix, at most nameMaxLength characters long.
 */
const fitName = (name: string, suffix = ''): string => name.slice(0, nameMaxLength - suffix.length) + suffix

/**
 * Prefixes the name when it doesn't start with a letter (e.g. ODK names like "_7" or "__version__").
 * @param {string} name - The name.
 * @returns {string} - A name starting with a letter.
 */
const ensureStartsWithLetter = (name: string): string =>
  /^[a-z]/.test(name) ? name : `${namePrefixIfNotStartingWithLetter}${name}`

export default class NodeDefUniqueNameGenerator {
  names: string[]

  constructor() {
    this.names = []
  }

  /**
   * Generates a valid node def name not used yet: when the name is already used or is a keyword, the parent name is
   * added as prefix and then, if needed, a _# suffix.
   * @param {object} params - The parameters.
   * @param {string} [params.parentNodeDefName] - The name of the parent node def.
   * @param {string} params.nodeDefName - The (normalized) name of the node def.
   * @returns {string} - The unique name.
   */
  getUniqueNodeDefName({ parentNodeDefName, nodeDefName }: { parentNodeDefName?: string; nodeDefName: string }) {
    const isDuplicateOrKeyword = (name: string) => this.names.includes(name) || Validator.isKeyword(name)

    let finalName = fitName(ensureStartsWithLetter(nodeDefName))

    if (isDuplicateOrKeyword(finalName) && parentNodeDefName) {
      // try to add parent node def name as prefix
      finalName = fitName(`${parentNodeDefName}_${finalName}`)
    }
    if (isDuplicateOrKeyword(finalName)) {
      // make it unique by adding a _# suffix
      const baseName = finalName
      let count = 0
      do {
        count += 1
        finalName = fitName(baseName, `_${count}`)
      } while (isDuplicateOrKeyword(finalName))
    }

    this.names.push(finalName)

    return finalName
  }
}
