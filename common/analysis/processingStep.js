const R = require('ramda')

const ObjectUtils = require('../objectUtils')

const keys = {
  calculationSteps: 'calculationSteps',
  index: ObjectUtils.keys.index,
  uuid: ObjectUtils.keys.uuid
}

const keysProps = {
  entityUuid: 'entityUuid', // OR
  categoryUuid: 'categoryUuid', // OR
  virtual: 'virtual', //true|false
}

// ====== READ

const getCalculationSteps = R.propOr([], keys.entity)
const getEntityUuid = ObjectUtils.getProp(keysProps.entityUuid)
const getCategoryUuid = ObjectUtils.getProp(keysProps.categoryUuid)
const isVirtual = ObjectUtils.getProp(keysProps.virtual, false)

module.exports = {
  //READ
  getCalculationSteps,
  getCategoryUuid,
  getEntityUuid,
  getIndex: ObjectUtils.getIndex,
  getUuid: ObjectUtils.getUuid,
  isVirtual,
}