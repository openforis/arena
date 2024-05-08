import * as A from '@core/arena'

const keys = {
  dataType: 'dataType',
  index: 'index',
  name: 'name',
}

const dataTypes = {
  geometryPoint: 'geometryPoint',
  number: 'number',
  text: 'text',
}

const newItem = ({ dataType, index = 0 }) => ({
  [keys.dataType]: dataType,
  [keys.index]: index,
})

const getDataType = A.propOr(dataTypes.text, keys.dataType)
const getIndex = A.propOr(0, keys.index)
const getName = A.prop(keys.name)

export const ExtraPropDef = {
  keys,
  dataTypes,
  newItem,
  getDataType,
  getIndex,
  getName,
}
