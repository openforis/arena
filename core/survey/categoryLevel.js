const R = require('ramda')

const ObjectUtils = require('@core/objectUtils')

const keys = {
  uuid: ObjectUtils.keys.uuid,
  categoryUuid: 'categoryUuid',
  index: ObjectUtils.keys.index,
  items: 'items',
  props: ObjectUtils.keys.props,
}

const keysProps = {
  name: 'name'
}

module.exports = {
  keys,
  keysProps,

  //READ
  getUuid: ObjectUtils.getUuid,
  getIndex: R.prop(keys.index),
  getName: ObjectUtils.getProp(keysProps.name),
  getCategoryUuid: R.prop(keys.categoryUuid),
}