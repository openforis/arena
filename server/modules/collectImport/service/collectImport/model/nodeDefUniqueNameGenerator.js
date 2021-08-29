import * as Validator from '@core/validation/validator'

export default class NodeDefUniqueNameGenerator {
  constructor() {
    this.names = []
  }

  getUniqueNodeDefName({ parentNodeDefName, nodeDefName }) {
    let finalName = nodeDefName

    const isDuplicateOrKeyword = () => this.names.includes(finalName) || Validator.isKeyword(finalName)

    if (isDuplicateOrKeyword()) {
      // Name is in use or is a keyword

      // try to add parent node def name as prefix
      if (parentNodeDefName) {
        finalName = `${parentNodeDefName}_${finalName}`
      }

      if (isDuplicateOrKeyword()) {
        // Try to make it unique by adding _# suffix
        const prefix = `${finalName}_`
        let count = 0
        do {
          count += 1
          finalName = prefix + count
        } while (isDuplicateOrKeyword())
      }
    }

    this.names.push(finalName)

    return finalName
  }
}
