import * as NodeDef from '@core/survey/nodeDef'

const nativeProperties = {
  length: 'length',
}

const jsTypeByNodeDefType = {
  [NodeDef.nodeDefType.code]: String,
  [NodeDef.nodeDefType.date]: String,
  [NodeDef.nodeDefType.decimal]: Number,
  [NodeDef.nodeDefType.integer]: Number,
  [NodeDef.nodeDefType.text]: String,
}

const _hasProperty = ({ jsType, propName }) => Object.prototype.hasOwnProperty.call(jsType, propName)
const _hasFunction = ({ jsType, funcName }) => Boolean(jsType.prototype[funcName])

export const hasNativeProperty = ({ nodeDef, propName }) => {
  if (propName === nativeProperties.length && NodeDef.isMultiple(nodeDef)) {
    return true
  }
  const jsType = jsTypeByNodeDefType[NodeDef.getType(nodeDef)]
  return jsType && (_hasProperty({ jsType, propName }) || _hasFunction({ jsType, funcName: propName }))
}

export const evalNodeDefProperty = ({ nodeDef, propName }) => {
  if (propName === nativeProperties.length) {
    return 0
  }
  const jsType = jsTypeByNodeDefType[NodeDef.getType(nodeDef)]
  if (_hasProperty({ jsType, propName })) {
    return jsType[propName]
  } else {
    // return function with name "propertyName" and bind it to an empty object
    return jsType.prototype[propName].bind({})
  }
}
