const R = require('ramda')
const { uuidv4 } = require('../uuid')

const ObjectUtils = require('../objectUtils')

const keys = {
  uuid: 'uuid',
  props: 'props',
  parentUuid: 'parentUuid',
  levelUuid: 'levelUuid'
}

const props = {
  code: 'code',
  extra: 'extra',
}

// ====== CREATE
const newItem = (levelUuid, parentItemUuid = null, props = {}) => ({
  [keys.uuid]: uuidv4(),
  [keys.levelUuid]: levelUuid,
  [keys.parentUuid]: parentItemUuid,
  [keys.props]: ObjectUtils.clean(props),
})

// ====== READ
const getCode = ObjectUtils.getProp(props.code, '')

const getLabel = language => item => ObjectUtils.getLabel(language, getCode(item))(item)

module.exports = {
  keys,
  props,

  //CREATE
  newItem,

  //READ
  getUuid: ObjectUtils.getUuid,
  getLevelUuid: R.prop(keys.levelUuid),
  getParentUuid: R.prop(keys.parentUuid),
  getCode,
  getLabels: ObjectUtils.getLabels,
  getLabel ,
  getDescriptions: ObjectUtils.getDescriptions,
  getDescription: ObjectUtils.getDescription,
  getExtraProp: prop => R.pipe(
    ObjectUtils.getProp(keys.extra),
    R.propOr('', prop)
  ),

  isEqual: ObjectUtils.isEqual
}