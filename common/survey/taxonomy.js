const R = require('ramda')
const {uuidv4} = require('../uuid')

// ====== CREATE
const newTaxonomy = () => ({
  uuid: uuidv4(),
  props: {},
})

module.exports = {
  newTaxonomy,
}