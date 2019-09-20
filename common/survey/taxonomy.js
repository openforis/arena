const R = require('ramda')

const { uuidv4 } = require('../uuid')

const {
  getProp,
  getUuid,
} = require('./surveyUtils')

const keys = {
  published: 'published'
}

const keysProps = {
  name: 'name',
  vernacularLanguageCodes: 'vernacularLanguageCodes',
}

// ====== CREATE
const newTaxonomy = (props = {}) => ({
  uuid: uuidv4(),
  props,
})

module.exports = {
  keysProps,

  //CREATE
  newTaxonomy,

  //READ
  getUuid,
  getName: getProp(keysProps.name, ''),
  getVernacularLanguageCodes: getProp(keysProps.vernacularLanguageCodes, []),
  isPublished: R.propOr(false, keys.published)
}