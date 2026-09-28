import * as A from '@core/arena'

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
  index: 'index',
  extra: ObjectUtils.keysProps.extra,
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
export const { getExtra, getExtraProp, getProps, getPropsDraft, getPropsAndPropsDraft, getUuid, isEqual, setProp } =
  ObjectUtils
export const getTaxonomyUuid = A.prop(keys.taxonomyUuid)
export const getCode = ObjectUtils.getProp(propKeys.code, '')
export const getFamily = ObjectUtils.getProp(propKeys.family, '')
export const getGenus = ObjectUtils.getProp(propKeys.genus, '')
export const getScientificName = ObjectUtils.getProp(propKeys.scientificName, '')

export const getVernacularNames = A.propOr({}, keys.vernacularNames)
export const getVernacularNamesArray = (taxon) => Object.values(getVernacularNames(taxon)).flat()

export const getVernacularNamesByLang = (lang) => A.pipe(getVernacularNames, A.propOr([], lang))

export const getVernacularLanguage = A.propOr('', keys.vernacularLanguage)
export const getVernacularNameUuid = A.prop(keys.vernacularNameUuid)
export const getVernacularName = A.propOr('', keys.vernacularName)
export const getVernacularNameObjByUuid = (uuid) => (taxon) =>
  getVernacularNamesArray(taxon).find((vn) => TaxonVernacularName.getUuid(vn) === uuid)

export const isUnlistedTaxon = A.pipe(getCode, A.equals(unlistedCode))
export const isUnknownTaxon = A.pipe(getCode, A.equals(unknownCode))
export const isUnkOrUnlTaxon = (taxon) => isUnlistedTaxon(taxon) || isUnknownTaxon(taxon)

// ==== UPDATE
export const assocVernacularNames = (lang, vernacularNames) =>
  A.assocPath([keys.vernacularNames, lang], vernacularNames)

export const assocVernacularNamesByLang = (vernacularNames) => A.assoc(keys.vernacularNames, vernacularNames)

export const appendVernacularName = (vernacularName) => (taxon) =>
  A.pipe(
    getVernacularNamesByLang(TaxonVernacularName.getLang(vernacularName)),
    A.append(vernacularName),
    (vernacularNames) => assocVernacularNames(TaxonVernacularName.getLang(vernacularName), vernacularNames)(taxon)
  )(taxon)

const _mergeVernacularNames = (vernacularNamesArrayNew) => (vernacularNamesArrayExisting) =>
  A.reduce(
    (accVernacularNames, index) => {
      const vernacularNameNew = A.prop(index, vernacularNamesArrayNew)
      const vernacularNameExisting = A.prop(index, vernacularNamesArrayExisting)
      const vernacularNameUpdated =
        vernacularNameNew && vernacularNameExisting
          ? TaxonVernacularName.mergeProps(vernacularNameNew)(vernacularNameExisting) // Merge new vernacular name into existing one
          : vernacularNameNew || vernacularNameExisting // There is no existing vernacular name, take the new one
      return A.append(vernacularNameUpdated, accVernacularNames)
    },
    [],
    A.times(A.identity, Math.max(vernacularNamesArrayNew.length, vernacularNamesArrayExisting.length))
  )

export const mergeProps = (taxonNew) => (taxon) => {
  const vernacularNamesUpdated = Object.entries(getVernacularNames(taxonNew)).reduce(
    (accVernacularNames, [lang, vernacularNamesArray]) =>
      A.pipe(
        getVernacularNamesByLang(lang),
        _mergeVernacularNames(vernacularNamesArray),
        A.assoc(lang, A.__, accVernacularNames)
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

export const dissocExtraProp = (key) => A.dissocPath([keys.props, propKeys.extra, key])
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

// associate a single vernacular name (only for rendering in UI)
export const assocVernacularName = (vernacularName) => A.assoc(keys.vernacularName, vernacularName)

export const assocVernacularLanguage = (vernacularLanguage) => A.assoc(keys.vernacularLanguage, vernacularLanguage)

export const assocVernacularNameUuid = (vernacularNameUuid) => A.assoc(keys.vernacularNameUuid, vernacularNameUuid)
