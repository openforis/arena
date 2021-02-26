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

export const hasNativeProperty = ({ nodeDef, propertyName }) => {
  if (propertyName === nativeProperties.length && NodeDef.isMultiple(nodeDef)) {
    return true
  }
  const jsType = jsTypeByNodeDefType[NodeDef.getType(nodeDef)]
  return jsType && (Object.prototype.hasOwnProperty.call(jsType, propertyName) || jsType.prototype[propertyName])
}

export const evalNodeDefProperty = ({ nodeDef, propertyName }) => {
  if (propertyName === nativeProperties.length) {
    return 0
  }
  const jsType = jsTypeByNodeDefType[NodeDef.getType(nodeDef)]
  return Object.prototype.hasOwnProperty.call(jsType, propertyName)
    ? jsType[propertyName]
    : jsType.prototype[propertyName].bind({})
}
