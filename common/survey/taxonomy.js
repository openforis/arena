const R = require('ramda')

const { uuidv4 } = require('../uuid')
const ObjectUtils = require('../objectUtils')

const keys = {
  published: 'published'
}

const keysProps = {
  name: ObjectUtils.keys.name,
  vernacularLanguageCodes: 'vernacularLanguageCodes',
}

// ====== CREATE
const newTaxonomy = (props = {}) => ({
  [ObjectUtils.keys.uuid]: uuidv4(),
  [ObjectUtils.keys.props]: props,
})

module.exports = {
  keysProps,

  //CREATE
  newTaxonomy,

  //READ
  getUuid: ObjectUtils.getUuid,
  getName: ObjectUtils.getProp(keysProps.name, ''),
  getVernacularLanguageCodes: ObjectUtils.getProp(keysProps.vernacularLanguageCodes, []),
  isPublished: R.propOr(false, keys.published)
}