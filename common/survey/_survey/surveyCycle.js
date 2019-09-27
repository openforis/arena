const R = require('ramda')

const ObjectUtils = require('../../objectUtils')
const DateUtils = require('../../dateUtils')

const dateFormat = 'yyyy-MM-dd'

const keys = {
  dateStart: 'dateStart',
  dateEnd: 'dateEnd',
  descriptions: ObjectUtils.keysProps.descriptions,
  labels: ObjectUtils.keysProps.labels,
}

const newCycle = () => ({
  [keys.dateStart]: DateUtils.format(Date.now(), dateFormat)
})

module.exports = {
  newCycle,
}