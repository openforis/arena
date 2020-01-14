import * as R from 'ramda'
import { uuidv4 } from '@core/uuid'

import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'
import * as NodeDefValidations from './nodeDefValidations'

// ======== NODE DEF PROPERTIES

export const nodeDefType = {
  integer: 'integer',
  decimal: 'decimal',
  text: 'text',
  date: 'date',
  time: 'time',
  boolean: 'boolean',
  code: 'code',
  coordinate: 'coordinate',
  taxon: 'taxon',
  file: 'file',
  entity: 'entity',
}

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  parentUuid: ObjectUtils.keys.parentUuid,
  props: ObjectUtils.keys.props,
  propsAdvanced: 'propsAdvanced',
  meta: 'meta',
  draftAdvanced: 'draftAdvanced',
  type: 'type',
  deleted: 'deleted',
  analysis: 'analysis',
  published: 'published',
  temporary: 'temporary', // Not persisted yet
}

export const propKeys = {
  cycles: 'cycles',
  descriptions: ObjectUtils.keysProps.descriptions,
  key: 'key',
  labels: ObjectUtils.keysProps.labels,
  multiple: 'multiple',
  name: ObjectUtils.keys.name,
  readOnly: 'readOnly',

  // Code
  categoryUuid: 'categoryUuid',
  parentCodeDefUuid: 'parentCodeDefUuid',
  // Taxon
  taxonomyUuid: 'taxonomyUuid',
  // Analysis
  entitySourceUuid: 'entitySourceUuid',
}

export const keysPropsAdvanced = {
  applicable: 'applicable',
  defaultValues: 'defaultValues',
  validations: 'validations',
}

const metaKeys = {
  h: 'h',
}

export const maxKeyAttributes = 3

// ==== CREATE

export const newNodeDef = (nodeDefParent, type, cycle, props, propsAdvanced = {}, analysis = false) => ({
  [keys.uuid]: uuidv4(),
  [keys.parentUuid]: getUuid(nodeDefParent),
  [keys.type]: type,
  [keys.analysis]: analysis,
  [keys.props]: {
    ...props,
    [propKeys.cycles]: [cycle],
  },
  [keys.propsAdvanced]: {
    ...propsAdvanced,
  },
  [keys.meta]: {
    [metaKeys.h]: nodeDefParent ? [...getMetaHierarchy(nodeDefParent), getUuid(nodeDefParent)] : [],
  },
})

// ==== READ

export const getUuid = ObjectUtils.getUuid
export const getProp = ObjectUtils.getProp
export const getProps = ObjectUtils.getProps
export const isEqual = ObjectUtils.isEqual

export const getType = R.prop(keys.type)
export const getName = getProp(propKeys.name, '')
export const getParentUuid = ObjectUtils.getParentUuid
export const getCycles = getProp(propKeys.cycles, [])

export const isKey = R.pipe(getProp(propKeys.key), R.equals(true))
export const isRoot = R.pipe(getParentUuid, R.isNil)
export const isMultiple = R.pipe(getProp(propKeys.multiple), R.equals(true))
export const isSingle = R.pipe(isMultiple, R.not)

const isType = type => R.pipe(getType, R.equals(type))

export const isEntity = isType(nodeDefType.entity)
export const isSingleEntity = nodeDef => isEntity(nodeDef) && isSingle(nodeDef)
export const isMultipleEntity = nodeDef => isEntity(nodeDef) && isMultiple(nodeDef)
export const isEntityOrMultiple = nodeDef => isEntity(nodeDef) || isMultiple(nodeDef)

export const isAttribute = R.pipe(isEntity, R.not)
export const isSingleAttribute = nodeDef => isAttribute(nodeDef) && isSingle(nodeDef)
export const isMultipleAttribute = nodeDef => isAttribute(nodeDef) && isMultiple(nodeDef)

export const isBoolean = isType(nodeDefType.boolean)
export const isCode = isType(nodeDefType.code)
export const isCoordinate = isType(nodeDefType.coordinate)
export const isDecimal = isType(nodeDefType.decimal)
export const isFile = isType(nodeDefType.file)
export const isInteger = isType(nodeDefType.integer)
export const isTaxon = isType(nodeDefType.taxon)

export const isReadOnly = getProp(propKeys.readOnly, false)

export const isPublished = R.propEq(keys.published, true)
export const isDeleted = R.propEq(keys.deleted, true)
export const isAnalysis = R.propEq(keys.analysis, true)
export const isTemporary = R.propEq(keys.temporary, true)

export const getLabels = ObjectUtils.getLabels
export const getDescriptions = getProp(propKeys.descriptions, {})
export const getCategoryUuid = getProp(propKeys.categoryUuid)
export const getTaxonomyUuid = getProp(propKeys.taxonomyUuid)
export const getEntitySourceUuid = getProp(propKeys.entitySourceUuid)

// Utils
export const getLabel = (nodeDef, lang) => {
  const label = R.path([keys.props, propKeys.labels, lang], nodeDef)
  return StringUtils.isBlank(label) ? getName(nodeDef) : label
}

export const getCycleFirst = R.pipe(getCycles, R.head)

// Advanced props
export const getPropsAdvanced = R.propOr({}, keys.propsAdvanced)
export const getPropAdvanced = (prop, defaultTo = null) =>
  R.pipe(getPropsAdvanced, R.pathOr(defaultTo, prop.split('.')))
export const hasAdvancedPropsDraft = R.pipe(R.prop(keys.draftAdvanced), R.isEmpty, R.not)

export const getDefaultValues = getPropAdvanced(keysPropsAdvanced.defaultValues, [])
export const hasDefaultValues = R.pipe(getDefaultValues, R.isEmpty, R.not)

export const getValidations = getPropAdvanced(keysPropsAdvanced.validations, {})
export const getValidationExpressions = R.pipe(getValidations, NodeDefValidations.getExpressions)

export const getApplicable = getPropAdvanced(keysPropsAdvanced.applicable, [])

// ==== READ meta
export const getMeta = R.propOr({}, keys.meta)

export const getMetaHierarchy = R.pathOr([], [keys.meta, metaKeys.h])

export const getParentCodeDefUuid = getProp(propKeys.parentCodeDefUuid)

// ==== UPDATE

export const assocMetaHierarchy = R.assocPath([keys.meta, metaKeys.h])
export const mergeProps = ObjectUtils.mergeProps
const assocPropsAdvanced = R.assoc(keys.propsAdvanced)
export const mergePropsAdvanced = propsAdvanced => nodeDef =>
  R.pipe(getPropsAdvanced, R.mergeLeft(propsAdvanced), propsAdvancedUpdated =>
    assocPropsAdvanced(propsAdvancedUpdated, nodeDef),
  )(nodeDef)

export const dissocTemporary = R.dissoc(keys.temporary)

// ==== UTILS
export const canNodeDefBeMultiple = nodeDef =>
  !isAnalysis(nodeDef) &&
  ((isEntity(nodeDef) && !isRoot(nodeDef)) ||
    R.includes(getType(nodeDef), [
      nodeDefType.decimal,
      nodeDefType.code,
      nodeDefType.file,
      nodeDefType.integer,
      nodeDefType.text,
    ]))

export const canNodeDefBeKey = nodeDef => !isAnalysis(nodeDef) && canNodeDefTypeBeKey(getType(nodeDef))

export const canNodeDefTypeBeKey = type =>
  R.includes(type, [
    nodeDefType.date,
    nodeDefType.decimal,
    nodeDefType.code,
    nodeDefType.integer,
    nodeDefType.taxon,
    nodeDefType.text,
    nodeDefType.time,
  ])

export const canHaveDefaultValue = nodeDef =>
  isSingleAttribute(nodeDef) &&
  R.includes(getType(nodeDef), [
    nodeDefType.boolean,
    nodeDefType.code,
    nodeDefType.date,
    nodeDefType.decimal,
    nodeDefType.integer,
    nodeDefType.taxon,
    nodeDefType.text,
    nodeDefType.time,
  ]) &&
  // Allow default value when parent code is null (for node def code)
  !getParentCodeDefUuid(nodeDef)
