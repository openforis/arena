import { uuidv4 } from '@core/uuid'
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  props: ObjectUtils.keys.props,
}

export const keysProps = {
  lang: 'lang',
  name: 'name',
}

export const NAMES_SEPARATOR = ' / '

// ===== CREATE
export const newTaxonVernacularName = (lang, name) => ({
  [keys.uuid]: uuidv4(),
  [keys.props]: {
    [keysProps.lang]: lang,
    [keysProps.name]: name,
  },
})

// ===== READ
export const { getProps, getPropsDraft, getPropsAndPropsDraft, getUuid } = ObjectUtils
export const getName = ObjectUtils.getProp(keysProps.name)
export const getLang = ObjectUtils.getProp(keysProps.lang)

// ===== UTILS
export const mergeProps = (vernacularNameNew) => (vernacularName) => ({
  ...vernacularName,
  [keys.props]: {
    ...getProps(vernacularName),
    [keysProps.name]: getName(vernacularNameNew),
  },
})
