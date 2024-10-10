import { UUIDs } from '@openforis/arena-core'

import * as A from '@core/arena'

const keys = {
  dataType: 'dataType',
  index: 'index',
  name: 'name',
  uuid: 'uuid',
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

// UPDATE
const assocIndex = A.assoc(keys.index)

// UTILS
const extraDefsToArray = (extraDefs) =>
  // add uuid and name to each extra def item definition and put them in a array
  Object.entries(extraDefs)
    .map(([name, item], index) => ({
      ...item,
      [keys.uuid]: UUIDs.v4(),
      [keys.name]: name,
      [keys.dataType]: getDataType(item),
      [keys.index]: getIndex(item) ?? index,
    }))
    .sort((itemA, itemB) => getIndex(itemA) - getIndex(itemB))

export const ExtraPropDef = {
  keys,
  dataTypes,
  newItem,
  getDataType,
  getIndex,
  getName,
  assocIndex,
  extraDefsToArray,
}
