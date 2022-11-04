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
  extra: 'extra',
}

export const unlistedCode = 'UNL'
export const unknownCode = 'UNK'

// ===== CREATE
export const newTaxon = ({ taxonomyUuid, code, family, genus, scientificName, vernacularNames = {}, extra = {} }) => ({
  [keys.uuid]: uuidv4(),
  [keys.taxonomyUuid]: taxonomyUuid,
  [keys.props]: {
    [propKeys.code]: code,
    [propKeys.family]: family,
    [propKeys.genus]: genus,
    [propKeys.scientificName]: scientificName,
    [propKeys.extra]: extra,
  },
  [keys.vernacularNames]: vernacularNames,
})

// ====== READ
export const { getUuid, getProps, getPropsDraft, setProp } = ObjectUtils
export const getTaxonomyUuid = R.prop(keys.taxonomyUuid)
export const getCode = ObjectUtils.getProp(propKeys.code, '')
export const getFamily = ObjectUtils.getProp(propKeys.family, '')
export const getGenus = ObjectUtils.getProp(propKeys.genus, '')
export const getScientificName = ObjectUtils.getProp(propKeys.scientificName, '')

export const getVernacularNames = R.propOr({}, keys.vernacularNames)

export const getVernacularNamesByLang = (lang) => R.pipe(getVernacularNames, R.propOr([], lang))

export const getVernacularLanguage = R.propOr('', keys.vernacularLanguage)
export const getVernacularNameUuid = R.prop(keys.vernacularNameUuid)
export const getVernacularName = R.propOr('', keys.vernacularName)

export const getExtra = ObjectUtils.getProp(propKeys.extra, {})
export const getExtraProp = (extraPropKey) => (taxon) => {
  const extra = getExtra(taxon)
  return R.propOr(null, extraPropKey)(extra)
}

export const isUnlistedTaxon = R.pipe(getCode, R.equals(unlistedCode))
export const isUnknownTaxon = R.pipe(getCode, R.equals(unknownCode))

export const { isEqual } = ObjectUtils

// ==== UPDATE
export const assocVernacularNames = (lang, vernacularNames) =>
  R.assocPath([keys.vernacularNames, lang], vernacularNames)

export const appendVernacularName = (vernacularName) => (taxon) =>
  R.pipe(
    getVernacularNamesByLang(TaxonVernacularName.getLang(vernacularName)),
    R.append(vernacularName),
    (vernacularNames) => assocVernacularNames(TaxonVernacularName.getLang(vernacularName), vernacularNames)(taxon)
  )(taxon)

const _mergeVernacularNames = (vernacularNamesArrayNew) => (vernacularNamesArrayExisting) =>
  R.reduce(
    (accVernacularNames, index) => {
      const vernacularNameNew = R.prop(index, vernacularNamesArrayNew)
      const vernacularNameExisting = R.prop(index, vernacularNamesArrayExisting)
      const vernacularNameUpdated =
        vernacularNameNew && vernacularNameExisting
          ? TaxonVernacularName.mergeProps(vernacularNameNew)(vernacularNameExisting) // Merge new vernacular name into existing one
          : vernacularNameNew || vernacularNameExisting // There is no existing vernacular name, take the new one
      return R.append(vernacularNameUpdated, accVernacularNames)
    },
    [],
    R.times(R.identity, Math.max(vernacularNamesArrayNew.length, vernacularNamesArrayExisting.length))
  )

export const mergeProps = (taxonNew) => (taxon) => {
  const vernacularNamesUpdated = Object.entries(getVernacularNames(taxonNew)).reduce(
    (accVernacularNames, [lang, vernacularNamesArray]) =>
      R.pipe(
        getVernacularNamesByLang(lang),
        _mergeVernacularNames(vernacularNamesArray),
        R.assoc(lang, R.__, accVernacularNames)
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
      [propKeys.extra]: getExtra(taxonNew),
    },
    [keys.vernacularNames]: vernacularNamesUpdated,
  }
}

export const dissocExtraProp = (key) => R.dissocPath([keys.props, propKeys.extra, key])
export const renameExtraProp =
  ({ nameOld, nameNew }) =>
  (taxon) => {
    const extra = getExtra(taxon)
    const extraUpdated = { ...extra }
    const extraProp = extra[nameOld]
    delete extraUpdated[nameOld]
    extraUpdated[nameNew] = extraProp
    return setProp(propKeys.extra, extraUpdated)(taxon)
  }
