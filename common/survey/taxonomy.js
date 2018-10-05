const {uuidv4} = require('../uuid')

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

module.exports = {
  //CREATE
  newTaxonomy,
  newTaxon,

  //READ
  getTaxonomyName: getProp('name'),

  // UPDATE
  assocTaxonomyProp: setProp,
}