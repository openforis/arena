import * as NodeDef from '@core/survey/nodeDef'
import * as Validator from '@core/validation/validator'

export default class NodeDefUniqueNameGenerator {
  constructor() {
    this.names = []
  }

  getUniqueNodeDefName({ parentNodeDef, nodeDefName }) {
    let finalName = nodeDefName

    const isDuplicateOrKeyword = () => this.names.includes(finalName) || Validator.isKeyword(finalName)

    if (isDuplicateOrKeyword()) {
      // Name is in use or is a keyword

      // try to add parent node def name as prefix
      if (parentNodeDef) {
        finalName = `${NodeDef.getName(parentNodeDef)}_${finalName}`
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
