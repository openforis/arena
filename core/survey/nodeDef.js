import * as R from 'ramda'
import { uuidv4 } from '@core/uuid';

import * as ObjectUtils from '@core/objectUtils'
import * as NodeDefValidations from './nodeDefValidations'

import * as StringUtils from '@core/stringUtils'

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
  meta: 'meta',
  draftAdvanced: 'draftAdvanced',
  type: 'type',
  deleted: 'deleted',
  analysis: 'analysis',
  published: 'published',
}

export const propKeys = {
  applicable: 'applicable',
  cycles: 'cycles',
  defaultValues: 'defaultValues',
  descriptions: ObjectUtils.keysProps.descriptions,
  key: 'key',
  labels: ObjectUtils.keysProps.labels,
  multiple: 'multiple',
  name: ObjectUtils.keys.name,
  readOnly: 'readOnly',
  validations: 'validations',

  //code
  categoryUuid: 'categoryUuid',
  parentCodeDefUuid: 'parentCodeDefUuid',
  //taxon
  taxonomyUuid: 'taxonomyUuid'
}

const metaKeys = {
  h: 'h',
}

export const maxKeyAttributes = 3

// ==== CREATE

export const newNodeDef = (parentUuid, type, cycle, props, analysis = false) => ({
  [keys.uuid]: uuidv4(),
  [keys.parentUuid]: parentUuid,
  [keys.type]: type,
  [keys.analysis]: analysis,
  [keys.props]: {
    ...props,
    [propKeys.cycles]: [cycle]
  },
})

// ==== READ

export const getType = R.prop(keys.type)
export const getName = ObjectUtils.getProp(propKeys.name, '')
export const getParentUuid = ObjectUtils.getParentUuid
export const getCycles = ObjectUtils.getProp(propKeys.cycles, [])

export const isKey = R.pipe(ObjectUtils.getProp(propKeys.key), R.equals(true))
export const isRoot = R.pipe(getParentUuid, R.isNil)
export const isMultiple = R.pipe(ObjectUtils.getProp(propKeys.multiple), R.equals(true))
export const isSingle = R.pipe(isMultiple, R.not)

const isType = type => R.pipe(getType, R.equals(type))

export const isEntity = isType(nodeDefType.entity)
export const isSingleEntity = nodeDef => isEntity(nodeDef) && isSingle(nodeDef)
export const isMultipleEntity = nodeDef => isEntity(nodeDef) && isMultiple(nodeDef)
export const isEntityOrMultiple = nodeDef => isEntity(nodeDef) || isMultiple(nodeDef)

export const isAttribute = R.pipe(isEntity, R.not)
export const isSingleAttribute = nodeDef => isAttribute(nodeDef) && isSingle(nodeDef)
export const isMultipleAttribute = nodeDef => isAttribute(nodeDef) && isMultiple(nodeDef)
export const isReadOnly = ObjectUtils.getProp(propKeys.readOnly, false)

export const isBoolean = isType(nodeDefType.boolean)
export const isCode = isType(nodeDefType.code)
export const isCoordinate = isType(nodeDefType.coordinate)
export const isDecimal = isType(nodeDefType.decimal)
export const isFile = isType(nodeDefType.file)
export const isInteger = isType(nodeDefType.integer)
export const isTaxon = isType(nodeDefType.taxon)

export const isPublished = R.propEq(keys.published, true)
export const isDeleted = R.propEq(keys.deleted, true)
export const isAnalysis = R.propEq(keys.analysis, true)

export const getLabel = (nodeDef, lang) => {
  const label = R.path([keys.props, propKeys.labels, lang], nodeDef)
  return StringUtils.isBlank(label)
    ? getName(nodeDef)
    : label
}

export const getUuid = ObjectUtils.getUuid
export const getProp = ObjectUtils.getProp
export const getProps = ObjectUtils.getProps
export const isEqual = ObjectUtils.isEqual

export const getLabels = ObjectUtils.getLabels
export const getDescriptions = ObjectUtils.getProp(propKeys.descriptions, {})
export const getCategoryUuid = ObjectUtils.getProp(propKeys.categoryUuid)
export const getTaxonomyUuid = ObjectUtils.getProp(propKeys.taxonomyUuid)
export const getCycleFirst = R.pipe(getCycles, R.head)

//advanced props
export const getDefaultValues = ObjectUtils.getProp(propKeys.defaultValues, [])
export const hasDefaultValues = R.pipe(getDefaultValues, R.isEmpty, R.not)

export const getValidations = ObjectUtils.getProp(propKeys.validations, {})

export const getApplicable = ObjectUtils.getProp(propKeys.applicable, [])
export const getValidationExpressions = R.pipe(
  getValidations,
  NodeDefValidations.getExpressions,
)
export const hasAdvancedPropsDraft = R.pipe(R.prop(keys.draftAdvanced), R.isEmpty, R.not)


// ==== READ meta
export const getMetaHierarchy = R.pathOr([], [keys.meta, metaKeys.h])

export const getParentCodeDefUuid = ObjectUtils.getProp(propKeys.parentCodeDefUuid)

// ==== UPDATE

export const assocMetaHierarchy = R.assocPath([keys.meta, metaKeys.h])

// ==== UTILS
export const canNodeDefBeMultiple = nodeDef =>
  (isEntity(nodeDef) && !isRoot(nodeDef)) ||
  R.includes(
    getType(nodeDef),
    [
      nodeDefType.decimal,
      nodeDefType.code,
      nodeDefType.file,
      nodeDefType.integer,
      nodeDefType.text
    ]
  )

export const canNodeDefBeKey = nodeDef => canNodeDefTypeBeKey(getType(nodeDef))

export const canNodeDefTypeBeKey = type =>
  R.includes(type,
    [
      nodeDefType.date,
      nodeDefType.decimal,
      nodeDefType.code,
      nodeDefType.integer,
      nodeDefType.taxon,
      nodeDefType.text,
      nodeDefType.time
    ]
  )

export const canHaveDefaultValue = nodeDef =>
  isSingleAttribute(nodeDef) &&
  R.includes(
    getType(nodeDef),
    [
      nodeDefType.boolean,
      nodeDefType.code,
      nodeDefType.date,
      nodeDefType.decimal,
      nodeDefType.integer,
      nodeDefType.taxon,
      nodeDefType.text,
      nodeDefType.time,
    ]
  )
  // allow default value when parent code is null (for node def code)
  && !getParentCodeDefUuid(nodeDef)
