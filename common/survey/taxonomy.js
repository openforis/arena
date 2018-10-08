const {uuidv4} = require('../uuid')
const R = require('ramda')

const {
  setProp,
  getProp,
} = require('./surveyUtils')

// ====== CREATE
const newTaxonomy = () => ({
  uuid: uuidv4(),
  props: {},
})

const newTaxon = (taxonomyId) => ({
  uuid: uuidv4(),
  taxonomyId,
  props: {},
})

// ====== READ
const getTaxonVernacularName = lang => R.pipe(
  getProp('vernacularNames', {}),
  R.prop(lang),
)

module.exports = {
  //CREATE
  newTaxonomy,
  newTaxon,

  //READ
  getTaxonomyName: getProp('name'),
  getTaxonCode: getProp('code'),
  getTaxonFamily: getProp('family'),
  getTaxonGenus: getProp('genus'),
  getTaxonScientificName: getProp('scientificName'),
  getTaxonVernacularNames: getProp('vernacularNames', {}),
  getTaxonVernacularName,

  // UPDATE
  assocTaxonomyProp: setProp,
}