import type { ArenaTaxon, ArenaVernacularName } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'
import * as TaxonVernacularName from '@core/survey/taxonVernacularName'
import { uuidv4 } from '@core/uuid'

type VernacularNamesByLang = Record<string, ArenaVernacularName[]>

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  taxonomyUuid: 'taxonomyUuid',
  props: ObjectUtils.keys.props,
  vernacularNames: 'vernacularNames',
  vernacularNameUuid: 'vernacularNameUuid',
  vernacularName: 'vernacularName',
  vernacularLanguage: 'vernacularLanguage',
} as const

export const propKeys = {
  code: 'code',
  family: 'family',
  genus: 'genus',
  scientificName: 'scientificName',
  index: 'index', // rank among the taxa of the taxonomy, computed when fetching them
  position: 'position', // row index in the last imported file: it determines the order of the taxa
  extra: ObjectUtils.keysProps.extra,
} as const

export const unlistedCode = 'UNL'
export const unknownCode = 'UNK'

// ===== CREATE
export const newTaxon = ({
  taxonomyUuid,
  code,
  family,
  genus,
  scientificName,
  vernacularNames = {},
  extra = {},
}: {
  taxonomyUuid: string
  code: string
  family?: string
  genus?: string
  scientificName: string
  vernacularNames?: VernacularNamesByLang
  extra?: Record<string, unknown>
}): ArenaTaxon => ({
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
export const getTaxonomyUuid = (taxon: ArenaTaxon): string | undefined => A.prop(keys.taxonomyUuid)(taxon)
export const getCode: (taxon: ArenaTaxon) => string = ObjectUtils.getProp(propKeys.code, '')
export const getFamily: (taxon: ArenaTaxon) => string = ObjectUtils.getProp(propKeys.family, '')
export const getGenus: (taxon: ArenaTaxon) => string = ObjectUtils.getProp(propKeys.genus, '')
export const getScientificName: (taxon: ArenaTaxon) => string = ObjectUtils.getProp(propKeys.scientificName, '')
export const getPosition: (taxon: ArenaTaxon) => number | null = ObjectUtils.getProp(propKeys.position)

export const getVernacularNames = (taxon: ArenaTaxon): VernacularNamesByLang =>
  A.propOr({}, keys.vernacularNames)(taxon)
export const getVernacularNamesArray = (taxon: ArenaTaxon): ArenaVernacularName[] =>
  Object.values(getVernacularNames(taxon)).flat()

export const getVernacularNamesByLang =
  (lang: string) =>
  (taxon: ArenaTaxon): ArenaVernacularName[] =>
    A.propOr([], lang)(getVernacularNames(taxon))

export const getVernacularLanguage = (taxon: ArenaTaxon): string => A.propOr('', keys.vernacularLanguage)(taxon)
export const getVernacularNameUuid = (taxon: ArenaTaxon): string | undefined => A.prop(keys.vernacularNameUuid)(taxon)
export const getVernacularName = (taxon: ArenaTaxon): string => A.propOr('', keys.vernacularName)(taxon)
export const getVernacularNameObjByUuid =
  (uuid: string) =>
  (taxon: ArenaTaxon): ArenaVernacularName | undefined =>
    getVernacularNamesArray(taxon).find((vn) => TaxonVernacularName.getUuid(vn) === uuid)
// UUID of the vernacular name with the specified name (in any language)
export const getVernacularNameUuidByName =
  (name: string) =>
  (taxon: ArenaTaxon): string | undefined => {
    const vernacularName = getVernacularNamesArray(taxon).find((vn) => TaxonVernacularName.getName(vn) === name)
    return vernacularName ? TaxonVernacularName.getUuid(vernacularName) : undefined
  }

export const isUnlistedTaxon = (taxon: ArenaTaxon): boolean => getCode(taxon) === unlistedCode
export const isUnknownTaxon = (taxon: ArenaTaxon): boolean => getCode(taxon) === unknownCode
export const isUnkOrUnlTaxon = (taxon: ArenaTaxon): boolean => isUnlistedTaxon(taxon) || isUnknownTaxon(taxon)

// ==== UPDATE
export const assocVernacularNames = (lang: string, vernacularNames: ArenaVernacularName[]) =>
  A.assocPath([keys.vernacularNames, lang], vernacularNames)

export const assocVernacularNamesByLang = (vernacularNames: VernacularNamesByLang) =>
  A.assoc(keys.vernacularNames, vernacularNames)

export const appendVernacularName =
  (vernacularName: ArenaVernacularName) =>
  (taxon: ArenaTaxon): ArenaTaxon => {
    const lang = TaxonVernacularName.getLang(vernacularName)
    const vernacularNames = [...getVernacularNamesByLang(lang)(taxon), vernacularName]
    return assocVernacularNames(lang, vernacularNames)(taxon)
  }

const _mergeVernacularNames = (
  vernacularNamesArrayNew: ArenaVernacularName[],
  vernacularNamesArrayExisting: ArenaVernacularName[]
): ArenaVernacularName[] =>
  Array.from({ length: Math.max(vernacularNamesArrayNew.length, vernacularNamesArrayExisting.length) }, (_, index) => {
    const vernacularNameNew = vernacularNamesArrayNew[index]
    const vernacularNameExisting = vernacularNamesArrayExisting[index]
    return vernacularNameNew && vernacularNameExisting
      ? TaxonVernacularName.mergeProps(vernacularNameNew)(vernacularNameExisting) // merge new into existing
      : vernacularNameNew || vernacularNameExisting // no existing vernacular name: take the new one
  })

export const mergeProps =
  (taxonNew: ArenaTaxon) =>
  (taxon: ArenaTaxon): ArenaTaxon => {
    const vernacularNamesUpdated: VernacularNamesByLang = {}
    for (const [lang, vernacularNamesArray] of Object.entries(getVernacularNames(taxonNew))) {
      vernacularNamesUpdated[lang] = _mergeVernacularNames(vernacularNamesArray, getVernacularNamesByLang(lang)(taxon))
    }
    const positionNew = getPosition(taxonNew)

    return {
      ...taxon,
      [keys.props]: {
        ...getProps(taxon),
        [propKeys.family]: getFamily(taxonNew),
        [propKeys.genus]: getGenus(taxonNew),
        [propKeys.scientificName]: getScientificName(taxonNew),
        [propKeys.extra]: getExtra(taxonNew),
        ...(A.isNil(positionNew) ? {} : { [propKeys.position]: positionNew }),
      },
      [keys.vernacularNames]: vernacularNamesUpdated,
    }
  }

export const dissocExtraProp = (key: string) => A.dissocPath([keys.props, propKeys.extra, key])
export const renameExtraProp =
  ({ nameOld, nameNew }: { nameOld: string; nameNew: string }) =>
  (taxon: ArenaTaxon): ArenaTaxon => {
    const extra = getExtra(taxon) as Record<string, unknown>
    const extraUpdated = { ...extra }
    const extraProp = extra[nameOld]
    delete extraUpdated[nameOld]
    extraUpdated[nameNew] = extraProp
    return setProp(propKeys.extra, extraUpdated)(taxon)
  }

// associate a single vernacular name (only for rendering in UI)
export const assocVernacularName = (vernacularName: string) => A.assoc(keys.vernacularName, vernacularName)

export const assocVernacularLanguage = (vernacularLanguage: string) =>
  A.assoc(keys.vernacularLanguage, vernacularLanguage)

export const assocVernacularNameUuid = (vernacularNameUuid: string) =>
  A.assoc(keys.vernacularNameUuid, vernacularNameUuid)
