import type { ArenaTaxonomy } from '@openforis/arena-core'

import * as A from '@core/arena'

import { uuidv4 } from '@core/uuid'
import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'

import { ExtraPropDef, ExtraPropDefItem, ExtraPropDefItems } from './extraPropDef'

export const keys = {
  // not stored in db
  taxaCount: 'taxaCount',
}

export const keysProps = {
  name: ObjectUtils.keys.name,
  descriptions: ObjectUtils.keysProps.descriptions,
  vernacularLanguageCodes: 'vernacularLanguageCodes',
  extraPropsDefs: 'extraPropsDefs',
}

export const maxTaxaInIndex = 1000

// ====== CREATE
export const newTaxonomy = (props: Record<string, unknown> = {}): ArenaTaxonomy => ({
  [ObjectUtils.keys.uuid]: uuidv4(),
  [ObjectUtils.keys.props]: props,
})

// READ
export const { getProps, getPropsDraft, getPropsAndPropsDraft, getUuid, isPublished } = ObjectUtils
export const getName: (taxonomy: ArenaTaxonomy) => string = ObjectUtils.getProp(keysProps.name, '')
export const { getDescriptions, getDescription } = ObjectUtils
export const getVernacularLanguageCodes: (taxonomy: ArenaTaxonomy) => string[] = ObjectUtils.getProp(
  keysProps.vernacularLanguageCodes,
  []
)
export const getExtraPropsDefs: (taxonomy: ArenaTaxonomy) => ExtraPropDefItems = ObjectUtils.getProp(
  keysProps.extraPropsDefs,
  {}
)
export const getExtraPropKeys = (taxonomy: ArenaTaxonomy): string[] => Object.keys(getExtraPropsDefs(taxonomy))
export const getExtraPropsDefsArray = (taxonomy: ArenaTaxonomy): ExtraPropDefItem[] =>
  ExtraPropDef.extraDefsToArray(getExtraPropsDefs(taxonomy))

export const getTaxaCount = (taxonomy: ArenaTaxonomy): number | undefined => A.prop(keys.taxaCount)(taxonomy)

export const isBigTaxonomy = (taxonomy: ArenaTaxonomy): boolean => getTaxaCount(taxonomy) > maxTaxaInIndex

// UPDATE
export const assocExtraPropsDefs =
  (extraPropsDefs: ExtraPropDefItems) =>
  (taxonomy: ArenaTaxonomy): ArenaTaxonomy =>
    ObjectUtils.setProp(keysProps.extraPropsDefs, extraPropsDefs)(taxonomy)

// UTILS
export const isEmpty = (taxonomy: ArenaTaxonomy): boolean =>
  StringUtils.isBlank(getName(taxonomy)) && A.isEmpty(getDescriptions(taxonomy))
export const hasExtraDefs = (taxonomy: ArenaTaxonomy): boolean => getExtraPropKeys(taxonomy).length > 0
