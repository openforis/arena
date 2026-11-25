import type { ArenaVernacularName } from '@openforis/arena-core'

import * as ObjectUtils from '@core/objectUtils'
import { uuidv4 } from '@core/uuid'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  props: ObjectUtils.keys.props,
} as const

export const keysProps = {
  lang: 'lang',
  name: 'name',
} as const

export const NAMES_SEPARATOR = ' / '

// ===== CREATE
export const newTaxonVernacularName = (lang: string, name: string): ArenaVernacularName => ({
  [keys.uuid]: uuidv4(),
  [keys.props]: {
    [keysProps.lang]: lang,
    [keysProps.name]: name,
  },
})

// ===== READ
export const { getProps, getPropsDraft, getPropsAndPropsDraft, getUuid } = ObjectUtils
export const getName: (vernacularName: ArenaVernacularName) => string = ObjectUtils.getProp(keysProps.name)
export const getLang: (vernacularName: ArenaVernacularName) => string = ObjectUtils.getProp(keysProps.lang)

// ===== UTILS
export const mergeProps =
  (vernacularNameNew: ArenaVernacularName) =>
  (vernacularName: ArenaVernacularName): ArenaVernacularName => ({
    ...vernacularName,
    [keys.props]: {
      ...getProps(vernacularName),
      [keysProps.name]: getName(vernacularNameNew),
    },
  })
