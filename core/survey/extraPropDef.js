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

const getDataType = A.propOr(dataTypes.text, keys.dataType)
const getName = A.prop(keys.name)

export const ExtraPropDef = {
  keys,
  dataTypes,
  newItem,
  getDataType,
  getName,
}
