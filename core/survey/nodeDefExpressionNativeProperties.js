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

const classByName = {
  number: Number,
  string: String,
}

const _getJsType = (nodeDefOrValue) => {
  if (NodeDef.getUuid(nodeDefOrValue)) {
    // the parameter is a nodeDef
    return jsTypeByNodeDefType[NodeDef.getType(nodeDefOrValue)]
  }
  // the parameter is a value (number or string)
  return classByName[typeof nodeDefOrValue]
}
const _hasProperty = ({ JsType, propName }) => Object.prototype.hasOwnProperty.call(JsType, propName)
const _hasFunction = ({ JsType, funcName }) => Boolean(JsType.prototype[funcName])

export const hasNativeProperty = ({ nodeDefOrValue, propName }) => {
  if (propName === nativeProperties.length && NodeDef.isMultiple(nodeDefOrValue)) {
    return true
  }
  const JsType = _getJsType(nodeDefOrValue)
  return JsType && (_hasProperty({ JsType, propName }) || _hasFunction({ JsType, funcName: propName }))
}

export const evalNodeDefProperty = ({ nodeDefOrValue, propName }) => {
  if (propName === nativeProperties.length) {
    return 0
  }
  const JsType = _getJsType(nodeDefOrValue)
  if (_hasProperty({ JsType, propName })) {
    return JsType[propName]
  }
  // return function with name "propertyName" and bind it to an instance of JsType
  return JsType.prototype[propName].bind(new JsType())
}
