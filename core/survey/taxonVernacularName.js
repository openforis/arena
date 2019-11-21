import { uuidv4 } from '@core/uuid'
import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  props: ObjectUtils.keys.props
}

export const keysProps = {
  lang: 'lang',
  name: 'name',
}

// ===== CREATE
export const newTaxonVernacularName = (lang, name) => ({
  [keys.uuid]: uuidv4(),
  [keys.props]: {
    [keysProps.lang]: lang,
    [keysProps.name]: name,
  }
})

// ===== READ
export const getUuid = ObjectUtils.getUuid
export const getProps = ObjectUtils.getProps
export const getName = ObjectUtils.getProp(keysProps.name)

// ===== UTILS
export const mergeProps = vernacularNameNew => vernacularName => ({
  ...vernacularName,
  [keys.props]: {
    ...getProps(vernacularName),
    [keysProps.name]: getName(vernacularNameNew)
  }
})