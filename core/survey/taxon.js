import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as ObjectUtils from '@core/objectUtils'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'

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
  [keys.uuid]: uuidv4(),
  [keys.taxonomyUuid]: taxonomyUuid,
  [keys.props]: {
    [propKeys.code]: code,
    [propKeys.family]: family,
    [propKeys.genus]: genus,
    [propKeys.scientificName]: scientificName,
  },
  [keys.vernacularNames]: vernacularNames
})

// ====== READ
export const getUuid = ObjectUtils.getUuid
export const getProps = ObjectUtils.getProps
export const getTaxonomyUuid = R.prop(keys.taxonomyUuid)
export const getCode = ObjectUtils.getProp(propKeys.code, '')
export const getFamily = ObjectUtils.getProp(propKeys.family, '')
export const getGenus = ObjectUtils.getProp(propKeys.genus, '')
export const getScientificName = ObjectUtils.getProp(propKeys.scientificName, '')

export const getVernacularNames = R.propOr({}, keys.vernacularNames)

export const getVernacularNamesByLang = lang => R.pipe(
  getVernacularNames,
  R.propOr([], lang),
)

export const getVernacularLanguage = R.propOr('', keys.vernacularLanguage)
export const getVernacularNameUuid = R.prop(keys.vernacularNameUuid)
export const getVernacularName = R.propOr('', keys.vernacularName)

export const isUnlistedTaxon = R.pipe(getCode, R.equals(unlistedCode))
export const isUnknownTaxon = R.pipe(getCode, R.equals(unknownCode))

export const isEqual = ObjectUtils.isEqual

//==== UPDATE
export const assocVernacularNames = (lang, vernacularNames) => R.assocPath([keys.vernacularNames, lang], vernacularNames)

export const appendVernacularName = vernacularName => taxon => R.pipe(
  getVernacularNamesByLang(TaxonVernacularName.getLang(vernacularName)),
  R.append(vernacularName),
  vernacularNames => assocVernacularNames(TaxonVernacularName.getLang(vernacularName), vernacularNames)(taxon)
)(taxon)

const _mergeVernacularNames = vernacularNamesArrayNew => vernacularNamesArrayExisting =>
  R.reduce(
    (accVernacularNames, index) => {
      const vernacularNameNew = R.prop(index, vernacularNamesArrayNew)
      const vernacularNameExisting = R.prop(index, vernacularNamesArrayExisting)
      const vernacularNameUpdated = vernacularNameNew && vernacularNameExisting
        ? TaxonVernacularName.mergeProps(vernacularNameNew)(vernacularNameExisting) // merge new vernacular name into existing one
        : vernacularNameNew
          ? vernacularNameNew // there is no existing vernacular name, take the new one
          : vernacularNameExisting // take the existing one
      return R.append(vernacularNameUpdated, accVernacularNames)
    },
    [],
    R.times(R.identity, Math.max(vernacularNamesArrayNew.length, vernacularNamesArrayExisting.length))
  )

export const mergeProps = taxonNew => taxon => {
  const vernacularNamesUpdated = Object.entries(getVernacularNames(taxonNew)).reduce(
    (accVernacularNames, [lang, vernacularNamesArray]) =>
      R.pipe(
        getVernacularNamesByLang(lang),
        _mergeVernacularNames(vernacularNamesArray),
        vernacularNamesUpdated => R.assoc(lang, vernacularNamesUpdated, accVernacularNames)
      )(taxon),
    {}
  )

  return {
    ...taxon,
    [keys.props]: {
      ...getProps(taxon),
      [propKeys.family]: getFamily(taxonNew),
      [propKeys.genus]: getGenus(taxonNew),
      [propKeys.scientificName]: getScientificName(taxonNew),
    },
    [keys.vernacularNames]: vernacularNamesUpdated,
  }
}
