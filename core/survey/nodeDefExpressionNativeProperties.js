import * as NodeDef from '@core/survey/nodeDef'
import * as Validation from '@core/validation/validation'
import SystemError from '@core/systemError'

const nativeProperties = {
  length: 'length',
}

const nativePropertiesEvaluators = {
  length: ({ node }) => {
    if (Array.isArray(node)) {
      return node.length
    }
    throw new SystemError(Validation.messageKeys.expressions.cannotGetLengthOfSingleNodes)
  },
}

export const isNativePropertyAllowed = ({ nodeDef, propertyName }) =>
  propertyName === nativeProperties.length && NodeDef.isMultiple(nodeDef)

export const isNativeProperty = (propName) => Object.values(nativeProperties).includes(propName)

export const evalProperty = ({ node, propertyName }) => {
  const evaluator = nativePropertiesEvaluators[propertyName]
  if (!evaluator) {
    throw new SystemError(`Node property not supported: ${propertyName}`)
  }
  return evaluator({ node })
}
