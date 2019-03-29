const R = require('ramda')

const { uuidv4 } = require('../uuid')

const {
  getProp,
  getUuid,
} = require('./surveyUtils')

const keys = {
  published: 'published'
}

const taxonomyPropKeys = {
  name: 'name',
  vernacularLanguageCodes: 'vernacularLanguageCodes',
}

// ====== CREATE
const newTaxonomy = (props = {}) => ({
  uuid: uuidv4(),
  props,
})

module.exports = {
  taxonomyPropKeys,

  //CREATE
  newTaxonomy,

  //READ
  getUuid,
  getName: getProp(taxonomyPropKeys.name, ''),
  getVernacularLanguageCodes: getProp(taxonomyPropKeys.vernacularLanguageCodes, []),
  isPublished: R.propOr(false, keys.published)
}