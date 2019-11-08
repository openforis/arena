import * as R from 'ramda'

import { uuidv4 } from '@core/uuid';
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  taxonomyUuid: 'taxonomyUuid',
  props: ObjectUtils.keys.props,
  vernacularNames: 'vernacularNames',
  vernacularNameUuid: 'vernacularNameUuid',
  vernacularName: 'vernacularName',
  vernacularLanguage: 'vernacularLanguage',
}

export const propKeys = {
  code: 'code',
  family: 'family',
  genus: 'genus',
  scientificName: 'scientificName',
}

export const unlistedCode = 'UNL'
export const unknownCode = 'UNK'

// ===== CREATE
export const newTaxon = (taxonomyUuid, code, family, genus, scientificName, vernacularNames = {}) => ({
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
export const getUuid = ObjectUtils.getUuid
export const getTaxonomyUuid = R.prop(keys.taxonomyUuid)
export const getCode = ObjectUtils.getProp(propKeys.code, '')
export const getFamily = ObjectUtils.getProp(propKeys.family, '')
export const getGenus = ObjectUtils.getProp(propKeys.genus, '')
export const getScientificName = ObjectUtils.getProp(propKeys.scientificName, '')

export const getVernacularNames = R.propOr({}, keys.vernacularNames)

export const getVernacularName = lang => taxon => R.pipe(
  getVernacularNames,
  R.prop(lang),
  R.defaultTo(
    R.propOr('', keys.vernacularName, taxon)
  )
)(taxon)

export const getVernacularLanguage = R.propOr('', keys.vernacularLanguage)
export const getVernacularNameUuid = R.prop(keys.vernacularNameUuid)

export const isUnlistedTaxon = R.pipe(getCode, R.equals(unlistedCode))
export const isUnknownTaxon = R.pipe(getCode, R.equals(unknownCode))

export const isEqual = ObjectUtils.isEqual
