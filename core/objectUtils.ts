import * as R from 'ramda'

import * as StringUtils from './stringUtils'
import * as DateUtils from './dateUtils'

export const keys = {
  authGroups: 'authGroups',
  cycle: 'cycle',
  dateCreated: 'dateCreated',
  dateModified: 'dateModified',
  draft: 'draft',
  extra: 'extra',
  id: 'id',
  index: 'index',
  name: 'name',
  nodeDefUuid: 'nodeDefUuid',
  parentUuid: 'parentUuid',
  props: 'props',
  propsDraft: 'propsDraft',
  published: 'published',
  uuid: 'uuid',
  temporary: 'temporary', // True when the object has been created but not persisted yet
} as const

export const keysProps = {
  descriptions: 'descriptions',
  labels: 'labels',
  cycles: 'cycles',
  extra: 'extra',
} as const

// ====== READ
export const getId = R.prop(keys.id)
export const getUuid = R.propOr(null, keys.uuid)

export const getProps = R.propOr({}, keys.props)
export const getPropsDraft = R.propOr({}, keys.propsDraft)
export const getProp =
  (prop: string, defaultTo: unknown = null) =>
  (obj: Record<string, unknown>): unknown =>
    R.pipe(getProps, R.pathOr(defaultTo, prop.split('.')))(obj)
export const isKeyTrue =
  (key: string) =>
  (obj: Record<string, unknown>): boolean =>
    !!R.propOr(false, key)(obj)
export const isPropTrue =
  (prop: string) =>
  (obj: Record<string, unknown>): boolean =>
    !!getProp(prop)(obj)

export const getParentUuid = R.propOr(null, keys.parentUuid)

export const getLabels = getProp(keysProps.labels, {})
export const getLabel = (lang: string, defaultTo: unknown = null) => R.pipe(getLabels, R.propOr(defaultTo, lang))

export const getDescriptions = getProp(keysProps.descriptions, {})
export const getDescription = (lang: string, defaultTo: unknown = null) =>
  R.pipe(getDescriptions, R.propOr(defaultTo, lang))

export const getExtra = getProp(keysProps.extra, {})
export const getExtraProp = (extraPropKey: string) => R.pipe(getExtra, R.propOr(null, extraPropKey))

export const getDate =
  (prop: string) =>
  (obj: Record<string, unknown>): unknown =>
    R.pipe(R.propOr(null, prop), R.unless(R.isNil, DateUtils.parseISO))(obj)
export const getDateCreated = getDate(keys.dateCreated)
export const getDateModified = getDate(keys.dateModified)

export const getCycle = R.prop(keys.cycle)
export const getCycles = getProp(keysProps.cycles, [])
export const getIndex = R.pipe(R.propOr(0, keys.index), Number)
export const getNodeDefUuid = R.prop(keys.nodeDefUuid)
export const getAuthGroups = R.propOr([], keys.authGroups)

export const isTemporary = isKeyTrue(keys.temporary)
export const isPublished = isKeyTrue(keys.published)
export const isDraft = isKeyTrue(keys.draft)

// ====== CHECK
const isBlank = (value: unknown): boolean =>
  value === null || value === undefined || R.isEmpty(value) || StringUtils.isBlank(value)
export const isEqual =
  (other: Record<string, unknown>) =>
  (self: Record<string, unknown>): boolean =>
    getUuid(other) === getUuid(self)

// ===== Props

export const getPropsDiff =
  (other: Record<string, unknown>) =>
  (obj: Record<string, unknown>): Record<string, unknown> => {
    const propsSelf = getProps(obj) as Record<string, unknown>
    const propsOther = getProps(other) as Record<string, unknown>
    return R.fromPairs(R.difference(R.toPairs(propsOther), R.toPairs(propsSelf)))
  }

// ===== UPDATE
export const assocIndex = R.assoc(keys.index)

export const mergeProps =
  (props: Record<string, unknown>) =>
  (obj: Record<string, unknown>): Record<string, unknown> =>
    R.pipe(getProps, R.mergeLeft(props), (propsUpdate: Record<string, unknown>) =>
      R.assoc(keys.props, propsUpdate, obj)
    )(obj)

export const setProp = (key: string, value: unknown) => R.assocPath([keys.props, key], value)

export const dissocProp = (key: string) => R.dissocPath([keys.props, key])

export const setInPath =
  (pathArray: string[], value: unknown, includeEmpty: boolean = true) =>
  (obj: Record<string, unknown>): Record<string, unknown> => {
    if (!includeEmpty && isBlank(value)) {
      return obj
    }

    let objCurrent: any = obj
    for (let index = 0; index < pathArray.length; index++) {
      const pathPart = pathArray[index]
      if (index === pathArray.length - 1) {
        objCurrent[pathPart] = value
      } else {
        if (!Object.prototype.hasOwnProperty.call(objCurrent, pathPart)) {
          objCurrent[pathPart] = {}
        }

        objCurrent = objCurrent[pathPart]
      }
    }
    return obj
  }

export const dissocTemporary = R.unless(R.isNil, R.dissoc(keys.temporary))

export const keepNonEmptyProps = (obj: Record<string, unknown>): Record<string, unknown> =>
  Object.entries(obj).reduce((acc: Record<string, unknown>, [key, value]) => {
    if (!isBlank(value)) {
      acc[key] = value
    }
    return acc
  }, {})

// ====== UTILS / uuid
const _getProp =
  (propNameOrExtractor: string | ((item: any) => unknown)) =>
  (item: any): unknown =>
    typeof propNameOrExtractor === 'string' ? R.path(propNameOrExtractor.split('.'))(item) : propNameOrExtractor(item)

export const toIndexedObj = (
  array: any[],
  propNameOrExtractor: string | ((item: any) => unknown)
): Record<string, any> =>
  array.reduce((acc: Record<string, any>, item) => {
    const prop = _getProp(propNameOrExtractor)(item)
    acc[prop as string] = item
    return acc
  }, {})

export const toUuidIndexedObj = R.partialRight(toIndexedObj, [keys.uuid])

export const groupByProps =
  (...propNamesOrExtractors: Array<string | ((item: any) => unknown)>) =>
  (items: any[]): Record<string, unknown> =>
    items.reduce((acc: Record<string, unknown>, item) => {
      const props = propNamesOrExtractors.map((propNameOrExtractor) => _getProp(propNameOrExtractor)(item))
      let itemsPartial: any = R.path(props as string[])(acc)
      if (!itemsPartial) {
        itemsPartial = []
      }
      itemsPartial.push(item)
      setInPath(props as string[], itemsPartial)(acc)
      return acc
    }, {})

export const groupByProp = groupByProps

export const clone = (obj: any): any => (R.isNil(obj) ? obj : JSON.parse(JSON.stringify(obj)))

export const getPropsAndPropsDraft =
  ({ backup = false } = {}): ((obj: Record<string, unknown>) => Record<string, unknown>) =>
  (obj: Record<string, unknown>): Record<string, unknown> => {
    // if not backup, keep published props empty (consider only propsDraft)
    // if backup, keep both props and propsDraft
    const props = getProps(obj)
    const propsDraft = getPropsDraft(obj)
    return {
      props: backup ? props : {},
      propsDraft: backup ? propsDraft : { ...props, ...propsDraft },
    }
  }

export const getPropsAndPropsDraftCombined = (obj: Record<string, unknown>): Record<string, unknown> => ({
  ...getProps(obj),
  ...getPropsDraft(obj),
})
