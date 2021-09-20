import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'

import * as Taxonomy from '@core/survey/taxonomy'

const keys = {
  published: 'published',
}

export const keysProps = {
  name: ObjectUtils.keys.name,
  descriptions: ObjectUtils.keysProps.descriptions,
  vernacularLanguageCodes: 'vernacularLanguageCodes',
  extraPropsDefs: 'extraPropsDefs',
}

// ====== CREATE
export const newTaxonomy = (props = {}) => ({
  [ObjectUtils.keys.uuid]: uuidv4(),
  [ObjectUtils.keys.props]: props,
})

// READ
export const { getProps, getPropsDraft, getUuid } = ObjectUtils
export const getName = ObjectUtils.getProp(keysProps.name, '')
export const { getDescriptions, getDescription } = ObjectUtils
export const getVernacularLanguageCodes = ObjectUtils.getProp(keysProps.vernacularLanguageCodes, [])
export const getExtraPropsDefs = ObjectUtils.getProp(keysProps.extraPropsDefs, {})
export const getExtraPropKeys = (taxonomy) => Object.keys(getExtraPropsDefs(taxonomy))
export const isPublished = R.propOr(false, keys.published)

// UPDATE
export const assocExtraPropsDefs = (extraPropsDefs) => (taxonomy) =>
  ObjectUtils.setProp(keysProps.extraPropsDefs, extraPropsDefs)(taxonomy)

// UTILS
export const isEmpty = (taxonomy) =>
  StringUtils.isBlank(Taxonomy.getName(taxonomy)) && R.isEmpty(Taxonomy.getDescriptions(taxonomy))
