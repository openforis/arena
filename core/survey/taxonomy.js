import * as R from 'ramda'

import { uuidv4 } from '@core/uuid'
import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'

import * as Taxonomy from '@core/survey/taxonomy'
import { ExtraPropDef } from './extraPropDef'

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
export const { getProps, getPropsDraft, getUuid, isPublished } = ObjectUtils
export const getName = ObjectUtils.getProp(keysProps.name, '')
export const { getDescriptions, getDescription } = ObjectUtils
export const getVernacularLanguageCodes = ObjectUtils.getProp(keysProps.vernacularLanguageCodes, [])
export const getExtraPropsDefs = ObjectUtils.getProp(keysProps.extraPropsDefs, {})
export const getExtraPropKeys = (taxonomy) => Object.keys(getExtraPropsDefs(taxonomy))
export const getExtraPropsDefsArray = (taxonomy) =>
  // add uuid and name to each extra prop definition and put them in a array
  Object.entries(getExtraPropsDefs(taxonomy)).map(([name, extraPropDef]) => ({
    ...extraPropDef,
    uuid: uuidv4(),
    name,
    dataType: ExtraPropDef.getDataType(extraPropDef),
  }))

// UPDATE
export const assocExtraPropsDefs = (extraPropsDefs) => (taxonomy) =>
  ObjectUtils.setProp(keysProps.extraPropsDefs, extraPropsDefs)(taxonomy)

// UTILS
export const isEmpty = (taxonomy) =>
  StringUtils.isBlank(Taxonomy.getName(taxonomy)) && R.isEmpty(Taxonomy.getDescriptions(taxonomy))
