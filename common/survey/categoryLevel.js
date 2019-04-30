const R = require('ramda')

const { getProp, getUuid } = require('./surveyUtils')

const keys = {
  uuid: 'uuid',
  categoryUuid: 'categoryUuid',
  index: 'index',
  props: 'props',
  items: 'items',
}

const props = {
  name: 'name'
}

module.exports = {
  keys,
  props,

  //READ
  getUuid,
  getIndex: R.prop(keys.index),
  getName: getProp(props.name),
}