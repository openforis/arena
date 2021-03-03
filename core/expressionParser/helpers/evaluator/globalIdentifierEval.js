import SystemError from '@core/systemError'

const globalObjects = {
  Array,
  Boolean,
  Date,
  Math,
  Number,
  String,
}

export const globalIdentifierEval = ({ identifierName, nodeContext }) => {
  if (identifierName in globalObjects) {
    return globalObjects[identifierName]
  }
  if (Object.values(globalObjects).includes(nodeContext)) {
    const result = nodeContext[identifierName]
    if (!result) {
      throw new SystemError('undefinedFunction', { fnName: identifierName })
    }
    return result
  }
  return null
}
