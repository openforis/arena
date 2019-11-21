import * as R from 'ramda'

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

export const NAMES_SEPARATOR = ' / '

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

export const mergeVernacularNames = vernacularNames => vernacularNamesExisting => {
  const namesExisting = R.map(getName)(vernacularNamesExisting)
  const vernacularNamesNew = R.reject(vernacularNameNew => R.includes(getName(vernacularNameNew), namesExisting))(vernacularNames)
  return R.concat(vernacularNamesNew, vernacularNamesExisting)
}