const ObjectUtils = require('../objectUtils')

// READ

module.exports = {
  keys: ObjectUtils.keys,

  // PROPS
  getProps: ObjectUtils.getProps,
  getProp: ObjectUtils.getProp,
  setProp: ObjectUtils.setProp,

  // LABELS
  getLabels: ObjectUtils.getLabels,
  getLabel: ObjectUtils.getLabel,

  // UTILS / uuid
  getUuid: ObjectUtils.getUuid,
  isEqual: ObjectUtils.isEqual,
  getParentUuid: ObjectUtils.getParentUuid,
  toIndexedObj: ObjectUtils.toIndexedObj,
  toUuidIndexedObj: ObjectUtils.toUuidIndexedObj,
}
