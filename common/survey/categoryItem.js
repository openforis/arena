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
  descriptions: 'descriptions',
  labels: 'labels',
}

// ====== CREATE
const newItem = (levelUuid, parentItemUuid = null, props = {}) => ({
  [keys.uuid]: uuidv4(),
  [keys.levelUuid]: levelUuid,
  [keys.parentUuid]: parentItemUuid,
  [keys.props]: props,
})

// ====== READ
const getCode = SurveyUtils.getProp(props.code, '')

const getLabels = SurveyUtils.getProp(props.labels)

const getLabel = language => item =>
  R.pipe(
    getLabels,
    R.propOr(getCode(item), language),
  )(item)

const getDescriptions = SurveyUtils.getProp(props.descriptions)

const getDescription = language => item =>
  R.pipe(
    getDescriptions,
    R.propOr('', language),
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
  getDescriptions,
  getDescription,

  isEqual: SurveyUtils.isEqual
}