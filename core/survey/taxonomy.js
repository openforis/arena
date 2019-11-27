import * as R from 'ramda'

import {uuidv4} from '@core/uuid'
import * as ObjectUtils from '@core/objectUtils'

const keys = {
  published: 'published'
}

export const keysProps = {
  name: ObjectUtils.keys.name,
  vernacularLanguageCodes: 'vernacularLanguageCodes',
}

// ====== CREATE
export const newTaxonomy = (props = {}) => ({
  [ObjectUtils.keys.uuid]: uuidv4(),
  [ObjectUtils.keys.props]: props,
})

// READ
export const getUuid = ObjectUtils.getUuid
export const getName = ObjectUtils.getProp(keysProps.name, '')
export const getVernacularLanguageCodes = ObjectUtils.getProp(keysProps.vernacularLanguageCodes, [])
export const isPublished = R.propOr(false, keys.published)
