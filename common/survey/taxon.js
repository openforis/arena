const R = require('ramda')

const { uuidv4 } = require('../uuid')
const SurveyUtils = require('./surveyUtils')

const keys = {
  uuid: SurveyUtils.keys.uuid,
  taxonomyUuid: 'taxonomyUuid',
  props: SurveyUtils.keys.props,
  vernacularNames: 'vernacularNames',
  vernacularNameUuid: 'vernacularNameUuid',
  vernacularName: 'vernacularName',
  vernacularLanguage: 'vernacularLanguage',
}

const propKeys = {
  code: 'code',
  family: 'family',
  genus: 'genus',
  scientificName: 'scientificName',
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
  },
  [keys.vernacularNames]: vernacularNames
})

// ====== READ
const getCode = SurveyUtils.getProp(propKeys.code, '')

const getVernacularNames = R.propOr({}, keys.vernacularNames)

const getVernacularName = lang => taxon => R.pipe(
  getVernacularNames,
  R.prop(lang),
  R.defaultTo(
    R.propOr('', keys.vernacularName, taxon)
  )
)(taxon)

const getVernacularLanguage = R.propOr('', keys.vernacularLanguage)

module.exports = {
  keys,
  propKeys,
  unlistedCode,
  unknownCode,

  //CREATE
  newTaxon,

  //READ
  getUuid: SurveyUtils.getUuid,
  getTaxonomyUuid: R.prop(keys.taxonomyUuid),
  getCode,
  getFamily: SurveyUtils.getProp(propKeys.family, ''),
  getGenus: SurveyUtils.getProp(propKeys.genus, ''),
  getScientificName: SurveyUtils.getProp(propKeys.scientificName, ''),
  getVernacularNames,
  getVernacularName,
  getVernacularLanguage,
  getVernacularNameUuid: R.prop(keys.vernacularNameUuid),
  isUnlistedTaxon: R.pipe(getCode, R.equals(unlistedCode)),
  isUnknownTaxon: R.pipe(getCode, R.equals(unknownCode)),

  isEqual: SurveyUtils.isEqual,
}