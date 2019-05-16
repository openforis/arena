const R = require('ramda')

const { uuidv4 } = require('../uuid')
const SurveyUtils = require('./surveyUtils')

const keys = {
  uuid: SurveyUtils.keys.uuid,
  taxonomyUuid: 'taxonomyUuid',
  props: SurveyUtils.keys.props,
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
const getCode = SurveyUtils.getProp(propKeys.code, '')

const getVernacularNames = SurveyUtils.getProp(propKeys.vernacularNames, {})

const getVernacularName = lang => R.pipe(
  getVernacularNames,
  R.prop(lang),
)

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
  getVernacularNameUuid: SurveyUtils.getProp(propKeys.vernacularNameUuid),
  isUnlistedTaxon: R.pipe(getCode, R.equals(unlistedCode)),
  isUnknownTaxon: R.pipe(getCode, R.equals(unknownCode)),
}