import { UUIDs } from '@openforis/arena-core'

import * as A from '@core/arena'

const keys = {
  dataType: 'dataType',
  index: 'index',
  locked: 'locked',
  name: 'name',
  uuid: 'uuid',
} as const

const dataTypes = {
  geometryPoint: 'geometryPoint',
  number: 'number',
  text: 'text',
} as const

export type ExtraPropDataType = (typeof dataTypes)[keyof typeof dataTypes]

// stored extra prop def (props indexed by name)
export interface ExtraPropDefItem {
  dataType?: ExtraPropDataType
  index?: number
  locked?: boolean
  uuid?: string
  name?: string
}

export type ExtraPropDefItems = Record<string, ExtraPropDefItem>

const newItem = ({
  dataType,
  index = 0,
  locked = false,
}: {
  dataType: ExtraPropDataType
  index?: number
  locked?: boolean
}): ExtraPropDefItem => ({
  [keys.uuid]: UUIDs.v4(),
  [keys.dataType]: dataType,
  [keys.index]: index,
  [keys.locked]: locked,
})

const getDataType = (extraPropDef: ExtraPropDefItem): ExtraPropDataType =>
  A.propOr(dataTypes.text, keys.dataType)(extraPropDef)
const getIndex = (extraPropDef: ExtraPropDefItem): number => A.propOr(0, keys.index)(extraPropDef)
const getName = (extraPropDef: ExtraPropDefItem): string | undefined => A.prop(keys.name)(extraPropDef)
const isLocked = (extraPropDef: ExtraPropDefItem): boolean => A.propOr(false, keys.locked)(extraPropDef)

// UPDATE
const assocIndex =
  (index: number) =>
  (extraPropDef: ExtraPropDefItem): ExtraPropDefItem => ({ ...extraPropDef, [keys.index]: index })

// UTILS
// adds uuid and name to each extra def and puts them in an array sorted by index
const extraDefsToArray = (extraDefs: ExtraPropDefItems): ExtraPropDefItem[] =>
  Object.entries(extraDefs)
    .map(([name, item]) => ({
      ...item,
      [keys.uuid]: UUIDs.v4(),
      [keys.name]: name,
      [keys.dataType]: getDataType(item),
      [keys.index]: getIndex(item),
    }))
    .sort((itemA, itemB) => getIndex(itemA) - getIndex(itemB))
    // re-assign indexes to ensure they are unique
    .map((item, index) => assocIndex(index)(item))

export const ExtraPropDef = {
  keys,
  dataTypes,
  newItem,
  getDataType,
  getIndex,
  getName,
  isLocked,
  assocIndex,
  extraDefsToArray,
}
