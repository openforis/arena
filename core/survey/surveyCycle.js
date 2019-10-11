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
const getDateStart = R.propOr(null, keys.dateStart)
const getDateEnd = R.propOr(null, keys.dateEnd)
const getDescriptions = R.propOr({}, keys.descriptions)
const getLabels = R.propOr({}, keys.labels)

//====== UPDATE
const setDateStart = R.assoc(keys.dateStart)
const setDateEnd = R.assoc(keys.dateEnd)

module.exports = {
  //CREATE
  newCycle,

  // READ
  getDateStart,
  getDateEnd,
  getDescriptions,
  getLabels,

  //UPDATE
  setDateStart,
  setDateEnd,
}