import * as A from '@core/arena'

const keys = {
  dataType: 'dataType',
  name: 'name',
}

const dataTypes = {
  geometryPoint: 'geometryPoint',
  number: 'number',
  text: 'text',
}

const newItem = ({ dataType }) => ({
  [keys.dataType]: dataType,
})

const getDataType = A.prop(keys.dataType)
const getName = A.prop(keys.name)

export const CategoryItemExtraDef = {
  keys,
  dataTypes,
  newItem,
  getDataType,
  getName,
}
