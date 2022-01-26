import * as R from 'ramda'
import { uuidv4 } from '@core/uuid'

import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  uuid: 'uuid',
  props: 'props',
  parentUuid: 'parentUuid',
  levelUuid: 'levelUuid',
}

export const keysProps = {
  code: 'code',
  extra: 'extra',
  labels: ObjectUtils.keysProps.labels,
}

// ====== CREATE
export const newItem = (levelUuid, parentItemUuid = null, props = {}) => ({
  [keys.uuid]: uuidv4(),
  [keys.levelUuid]: levelUuid,
  [keys.parentUuid]: parentItemUuid,
  [keys.props]: props,
})

// ====== READ
export const { getDescription, getDescriptions, getLabels, getProps, getPropsDraft, getUuid, isEqual } = ObjectUtils
export const getLevelUuid = R.prop(keys.levelUuid)
export const getParentUuid = R.prop(keys.parentUuid)
export const getCode = ObjectUtils.getProp(keysProps.code, '')
export const getLabel = (language) => (item) => ObjectUtils.getLabel(language, getCode(item))(item)

export const getLabelWithCode = (language) => (item) =>
  `(${getCode(item)}) ${ObjectUtils.getLabel(language, getCode(item))(item)}`

// ====== READ - Extra Props
export const getExtra = ObjectUtils.getProp(keysProps.extra)
export const getExtraProp = (prop) => R.pipe(getExtra, R.propOr('', prop))

// ====== UPDATE
export const assocProp = ({ key, value }) => ObjectUtils.setProp(key, value)

// ====== UTILS

// gets the ancestor codes as an array (only if ancestor codes have been populated during fetch)
export const getAncestorCodes = (item) => {
  const codes = []
  let levelIndex = 0
  while (true) {
    const levelCode = R.propOr(null, `level${levelIndex}Code`)(item)
    if (levelCode === null) {
      break
    }
    codes.push(levelCode)
    levelIndex += 1
  }
  return codes
}
