const R = require('ramda')

const { uuidv4 } = require('../uuid')
const { getProp, getUuid } = require('./surveyUtils')

const keys = {
  taxonomyUuid: 'taxonomyUuid',
  props: 'props'
}

const propKeys = {
  code: 'code',
  family: 'family',
  genus: 'genus',
  scientificName: 'scientificName',
  vernacularNames: 'vernacularNames',
  vernacularNameUuid: 'vernacularNameUuid',
}

const unlistedCode = 'UNL'
const unknownCode = 'UNK'

// ===== CREATE
const newTaxon = (taxonomyUuid, code, family, genus, scientificName, vernacularNames = {}) => ({
  uuid: uuidv4(),
  [keys.taxonomyUuid]: taxonomyUuid,
  props: {
    [propKeys.code]: code,
    [propKeys.family]: family,
    [propKeys.genus]: genus,
    [propKeys.scientificName]: scientificName,
    [propKeys.vernacularNames]: vernacularNames
  },
})

// ====== READ
const getCode = getProp(propKeys.code, '')

const getVernacularNames = getProp(propKeys.vernacularNames, {})

const getVernacularName = lang => R.pipe(
  getVernacularNames,
  R.prop(lang),
)

module.exports = {
  propKeys,
  unlistedCode,
  unknownCode,

  //CREATE
  newTaxon,

  //READ
  getUuid,
  getTaxonomyUuid: R.prop(keys.taxonomyUuid),
  getCode,
  getFamily: getProp(propKeys.family, ''),
  getGenus: getProp(propKeys.genus, ''),
  getScientificName: getProp(propKeys.scientificName, ''),
  getVernacularNames,
  getVernacularName,
  getVernacularNameUuid: getProp(propKeys.vernacularNameUuid),
  isUnlistedTaxon: R.pipe(getCode, R.equals(unlistedCode)),
  isUnknownTaxon: R.pipe(getCode, R.equals(unknownCode)),
}