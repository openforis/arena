const R = require('ramda')

const ObjectUtils = require('../objectUtils')
const DateUtils = require('../dateUtils')

const dateFormat = 'yyyy-MM-dd'

const keys = {
  dateStart: 'dateStart',
  dateEnd: 'dateEnd',
  descriptions: ObjectUtils.keysProps.descriptions,
  labels: ObjectUtils.keysProps.labels,
}

//====== CREATE
const newCycle = () => ({
  [keys.dateStart]: DateUtils.format(Date.now(), dateFormat)
})

//====== READ
const getDateStart = R.propOr('', keys.dateStart)
const getDateEnd = R.propOr('', keys.dateEnd)
const getDescriptions = R.propOr({}, keys.descriptions)
const getLabels = R.propOr({}, keys.labels)

module.exports = {
  //CREATE
  newCycle,

  // READ
  getDateStart,
  getDateEnd,
  getDescriptions,
  getLabels,
}