import { ArenaCategoryItem, CategoryItems, LanguageCode } from '@openforis/arena-core'

import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'
import { uuidv4 } from '@core/uuid'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  props: ObjectUtils.keys.props,
  parentUuid: 'parentUuid',
  levelUuid: 'levelUuid',
  published: ObjectUtils.keys.published,
}

export const keysProps = {
  code: 'code',
  extra: 'extra',
  labels: ObjectUtils.keysProps.labels,
  descriptions: ObjectUtils.keysProps.descriptions,
  index: 'index',
}

const codeAllowedCharacters = [
  '-', // minus symbol first to avoid considering it as a range in the RegExp
  '*',
  '+',
  '\\\\', // single backslash "\" character (it requires a double escape to be used in the RegExp)
  String.raw`\/`,
  '|',
  String.raw`\w`,
]
const codeNotAllowedCharactersRegExp = new RegExp(`[^${codeAllowedCharacters.join('')}]`, 'g')

// ====== CREATE
export const newItem = (
  levelUuid: string,
  parentItemUuid: string | null = null,
  props: Record<string, unknown> = {}
): ArenaCategoryItem => ({
  [keys.uuid]: uuidv4(),
  [keys.levelUuid]: levelUuid,
  [keys.parentUuid]: parentItemUuid,
  [keys.props]: props,
})

// ====== READ
export const {
  getDescription,
  getDescriptions,
  getExtra,
  getExtraProp,
  getId,
  getLabels,
  getProps,
  getPropsDraft,
  getPropsAndPropsDraft,
  getUuid,
  isEqual,
  isPublished,
  isDraft,
} = ObjectUtils
export const getLevelUuid = (item: ArenaCategoryItem): string => A.prop(keys.levelUuid)(item)
export const getParentUuid = (item: ArenaCategoryItem): string | null => A.prop(keys.parentUuid)(item)
export const getCode: (item: ArenaCategoryItem) => string = ObjectUtils.getProp(keysProps.code, '')
export const getLabel =
  (language: string, defaultToCode = true) =>
  (item: ArenaCategoryItem): string =>
    ObjectUtils.getLabel(language, defaultToCode ? getCode(item) : '')(item)
export const getLabelWithCode =
  (language: string) =>
  (item: ArenaCategoryItem): string =>
    CategoryItems.getLabelWithCode(item, language as LanguageCode)
export const getIndex = CategoryItems.getIndex

// ====== UPDATE
export const assocProp = ({ key, value }: { key: string; value: unknown }) => ObjectUtils.setProp(key, value)
// ====== UPDATE - Extra Props
export const dissocExtraProp = (key: string) => A.dissocPath([keys.props, keysProps.extra, key])
export const renameExtraProp =
  ({ nameOld, nameNew }: { nameOld: string; nameNew: string }) =>
  (item: ArenaCategoryItem): ArenaCategoryItem => {
    const extra = getExtra(item) as Record<string, unknown>
    const extraUpdated = { ...extra }
    const extraProp = extra[nameOld]
    delete extraUpdated[nameOld]
    extraUpdated[nameNew] = extraProp
    return assocProp({ key: keysProps.extra, value: extraUpdated })(item)
  }

// ====== UTILS

// gets the ancestor codes as an array (only if ancestor codes have been populated during fetch)
export const getAncestorCodes = (item: ArenaCategoryItem): string[] => {
  const getLevelCode = (levelIndex: number) => A.propOr(null, `level${levelIndex}Code`)

  const codes: string[] = []
  let levelIndex = 0
  let levelCode = getLevelCode(levelIndex)(item)
  while (levelCode !== null) {
    codes.push(levelCode)
    levelIndex += 1
    levelCode = getLevelCode(levelIndex)(item)
  }
  return codes
}

export const getCodesHierarchy = (item: ArenaCategoryItem): string[] => [...getAncestorCodes(item), getCode(item)]

export const normalizeCode: (code: string) => string = A.pipe(
  StringUtils.leftTrim,
  A.replace(codeNotAllowedCharactersRegExp, '_'),
  A.slice(0, 40)
)
