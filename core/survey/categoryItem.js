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

export const keysExtraDef = {
  dataType: 'dataType',
}

// ====== CREATE
export const newItem = (levelUuid, parentItemUuid = null, props = {}) => ({
  [keys.uuid]: uuidv4(),
  [keys.levelUuid]: levelUuid,
  [keys.parentUuid]: parentItemUuid,
  [keys.props]: props,
})

// ====== READ
export const { getDescription, getDescriptions, getLabels, getProps, getUuid, isEqual } = ObjectUtils
export const getLevelUuid = R.prop(keys.levelUuid)
export const getParentUuid = R.prop(keys.parentUuid)
export const getCode = ObjectUtils.getProp(keysProps.code, '')
export const getLabel = (language) => (item) => ObjectUtils.getLabel(language, getCode(item))(item)

// ====== READ - Extra Props
export const getExtra = ObjectUtils.getProp(keysProps.extra)
export const getExtraProp = (prop) => R.pipe(getExtra, R.propOr('', prop))

// ====== UPDATE
export const assocProp = ({ key, value }) => ObjectUtils.setProp(key, value)
