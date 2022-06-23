import * as R from 'ramda'
import { uuidv4 } from '@core/uuid'

import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  props: ObjectUtils.keys.props,
  parentUuid: 'parentUuid',
  levelUuid: 'levelUuid',
  published: ObjectUtils.keys.published,
}

export const keysProps = {
  code: 'code',
  extra: 'extra',
  labels: ObjectUtils.keysProps.labels,
  descriptions: ObjectUtils.keysProps.descriptions,
}

// ====== CREATE
export const newItem = (levelUuid, parentItemUuid = null, props = {}) => ({
  [keys.uuid]: uuidv4(),
  [keys.levelUuid]: levelUuid,
  [keys.parentUuid]: parentItemUuid,
  [keys.props]: props,
})

// ====== READ
export const { getDescription, getDescriptions, getLabels, getProps, getPropsDraft, getUuid, isEqual, isPublished } =
  ObjectUtils
export const getLevelUuid = R.prop(keys.levelUuid)
export const getParentUuid = R.prop(keys.parentUuid)
export const getCode = ObjectUtils.getProp(keysProps.code, '')
export const getLabel = (language) => (item) => ObjectUtils.getLabel(language, getCode(item))(item)

export const getLabelWithCode = (language) => (item) =>
  `(${getCode(item)}) ${ObjectUtils.getLabel(language, getCode(item))(item)}`

// ====== READ - Extra Props
export const getExtra = ObjectUtils.getProp(keysProps.extra)
export const getExtraProp = (prop) => R.pipe(getExtra, R.prop(prop))

// ====== UPDATE
export const assocProp = ({ key, value }) => ObjectUtils.setProp(key, value)
// ====== UPDATE - Extra Props
export const dissocExtraProp = (key) => R.dissocPath([keys.props, keysProps.extra, key])
export const renameExtraProp =
  ({ nameOld, nameNew }) =>
  (item) => {
    const extra = getExtra(item)
    const extraUpdated = { ...extra }
    const extraProp = extra[nameOld]
    delete extraUpdated[nameOld]
    extraUpdated[nameNew] = extraProp
    return assocProp({ key: keysProps.extra, value: extraUpdated })(item)
  }

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
