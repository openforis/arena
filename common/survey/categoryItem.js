const R = require('ramda')
const { uuidv4 } = require('../uuid')

const SurveyUtils = require('./surveyUtils')

const keys = {
  uuid: 'uuid',
  props: 'props',
  parentUuid: 'parentUuid',
  levelUuid: 'levelUuid'
}

const props = {
  code: 'code',
  labels: 'labels'
}

// ====== CREATE
const newItem = (levelUuid, parentItem = null, props = {}) => {
  return {
    [keys.uuid]: uuidv4(),
    [keys.levelUuid]: levelUuid,
    [keys.parentUuid]: SurveyUtils.getUuid(parentItem),
    [keys.props]: props,
  }
}

// ====== READ
const getCode = SurveyUtils.getProp(props.code)

const getLabels = SurveyUtils.getProp(props.labels)

const getLabel = language =>
  item =>
    R.pipe(
      getLabels,
      R.prop(language),
      R.defaultTo(getCode(item))
    )(item)

module.exports = {
  keys,
  props,

  //CREATE
  newItem,

  //READ
  getUuid: SurveyUtils.getUuid,
  getLevelUuid: R.prop(keys.levelUuid),
  getParentUuid: R.prop(keys.parentUuid),
  getCode,
  getLabels,
  getLabel,

  isEqual: SurveyUtils.isEqual
}