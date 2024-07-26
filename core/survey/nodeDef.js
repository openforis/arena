import * as R from 'ramda'

import { NodeDefs, Objects } from '@openforis/arena-core'

import { uuidv4 } from '@core/uuid'
import * as A from '@core/arena'
import * as ObjectUtils from '@core/objectUtils'
import * as StringUtils from '@core/stringUtils'
import { ArrayUtils } from '@core/arrayUtils'

import * as TextUtils from '@webapp/utils/textUtils'

import { nodeDefType } from './nodeDefType'
import * as NodeDefLayout from './nodeDefLayout'
import * as NodeDefValidations from './nodeDefValidations'
import * as NodeDefExpression from './nodeDefExpression'
import { valuePropsTaxon } from './nodeValueProps'

// ======== NODE DEF PROPERTIES

export { nodeDefType }

export const keys = {
  id: ObjectUtils.keys.id,
  uuid: ObjectUtils.keys.uuid,
  parentUuid: ObjectUtils.keys.parentUuid,
  props: ObjectUtils.keys.props,
  propsAdvanced: 'propsAdvanced',
  propsAdvancedDraft: 'propsAdvancedDraft',
  meta: 'meta',
  draftAdvanced: 'draftAdvanced',
  draftAdvancedApplicable: 'draftAdvancedApplicable',
  draftAdvancedDefaultValues: 'draftAdvancedDefaultValues',
  draftAdvancedValidations: 'draftAdvancedValidations',
  type: 'type',
  deleted: 'deleted',
  analysis: 'analysis',
  published: 'published',
  temporary: 'temporary', // Not persisted yet
  // Analysis
  virtual: 'virtual', // Virtual Entity
}

export const NodeDefLabelTypes = {
  name: 'name',
  label: 'label',
  labelAndName: 'labelAndName',
}

export const propKeys = {
  cycles: 'cycles',
  descriptions: ObjectUtils.keysProps.descriptions,
  enumerate: 'enumerate', // only for multiple entities
  key: 'key',
  labels: ObjectUtils.keysProps.labels,
  multiple: 'multiple',
  name: ObjectUtils.keys.name,
  readOnly: 'readOnly',
  layout: 'layout',
  // available only when readOnly is true
  hidden: 'hidden',

  // Text
  textInputType: 'textInputType',
  textTransform: 'textTransform',

  // Decimal
  maxNumberDecimalDigits: 'maxNumberDecimalDigits',

  // Boolean
  labelValue: 'labelValue',

  // Code
  categoryUuid: 'categoryUuid',
  parentCodeDefUuid: 'parentCodeDefUuid',
  // Taxon
  taxonomyUuid: 'taxonomyUuid',
  vernacularNameLabels: 'vernacularNameLabels',
  visibleFields: 'visibleFields',

  // File
  maxFileSize: 'maxFileSize', // max file size in MB
  fileType: 'fileType',

  // Coordinate
  allowOnlyDeviceCoordinate: 'allowOnlyDeviceCoordinate',
  includeAccuracy: 'includeAccuracy',
  includeAltitude: 'includeAltitude',
  includeAltitudeAccuracy: 'includeAltitudeAccuracy',
}

const commonAttributePropsKeys = [
  propKeys.cycles,
  propKeys.descriptions,
  propKeys.hidden,
  propKeys.key,
  propKeys.labels,
  propKeys.layout,
  propKeys.multiple,
  propKeys.name,
  propKeys.readOnly,
]

export const textInputTypes = {
  singleLine: 'singleLine',
  multiLine: 'multiLine',
}

export const textTransformValues = {
  [TextUtils.textTransformValues.none]: TextUtils.textTransformValues.none,
  [TextUtils.textTransformValues.lowercase]: TextUtils.textTransformValues.lowercase,
  [TextUtils.textTransformValues.uppercase]: TextUtils.textTransformValues.uppercase,
  [TextUtils.textTransformValues.capitalize]: TextUtils.textTransformValues.capitalize,
}

export const booleanLabelValues = {
  trueFalse: 'trueFalse',
  yesNo: 'yesNo',
}

export const coordinateAdditionalFields = {
  accuracy: 'accuracy',
  altitude: 'altitude',
  altitudeAccuracy: 'altitudeAccuracy',
}

export const fileTypeValues = {
  image: 'image',
  video: 'video',
  audio: 'audio',
  other: 'other',
}

export const keysPropsAdvanced = {
  applicable: 'applicable',
  defaultValues: 'defaultValues',
  defaultValueEvaluatedOneTime: 'defaultValueEvaluatedOneTime',
  excludedInClone: 'excludedInClone',
  validations: 'validations',
  formula: 'formula',

  // Analisys
  script: 'script',
  chainUuid: 'chainUuid',
  index: 'index',
  active: 'active',
  aggregateFunctions: 'aggregateFunctions',

  isBaseUnit: 'isBaseUnit',
  isSampling: 'isSampling',
  hasAreaBasedEstimated: 'hasAreaBasedEstimated',
  areaBasedEstimatedOf: 'areaBasedEstimatedOf', // uuid of area based estimated node def

  // code and taxon
  itemsFilter: 'itemsFilter',
}

const commonAttributePropsAdvancedKeys = [
  keysPropsAdvanced.applicable,
  keysPropsAdvanced.defaultValues,
  keysPropsAdvanced.defaultValueEvaluatedOneTime,
  keysPropsAdvanced.excludedInClone,
  keysPropsAdvanced.validations,
  keysPropsAdvanced.formula,
]

export const metaKeys = {
  h: 'h',
}

export const maxKeyAttributes = 5
const MAX_FILE_SIZE_DEFAULT = 10

export const visibleFieldsDefaultByType = {
  [nodeDefType.taxon]: [valuePropsTaxon.code, valuePropsTaxon.scientificName, valuePropsTaxon.vernacularName],
}

// ==== READ

export const {
  getLabels,
  getParentUuid,
  getProp,
  getProps,
  getPropsDraft,
  getPropsAndPropsDraft,
  getUuid,
  getId,
  isEqual,
  isPublished,
  isTemporary,
  dissocProp,
} = ObjectUtils

export const getType = R.prop(keys.type)
export const getName = getProp(propKeys.name, '')
export const getCycles = getProp(propKeys.cycles, [])

export const isKey = ObjectUtils.isPropTrue(propKeys.key)
export const isRoot = R.pipe(getParentUuid, R.isNil)
export const isMultiple = ObjectUtils.isPropTrue(propKeys.multiple)
export const isSingle = R.pipe(isMultiple, R.not)

const isType = (type) => (nodeDef) => getType(nodeDef) === type

export const isEntity = isType(nodeDefType.entity)
export const isSingleEntity = (nodeDef) => isEntity(nodeDef) && isSingle(nodeDef)
export const isMultipleEntity = (nodeDef) => isEntity(nodeDef) && isMultiple(nodeDef)
export const isEntityOrMultiple = (nodeDef) => isEntity(nodeDef) || isMultiple(nodeDef)

export const isAttribute = R.pipe(isEntity, R.not)
export const isSingleAttribute = (nodeDef) => isAttribute(nodeDef) && isSingle(nodeDef)
export const isMultipleAttribute = (nodeDef) => isAttribute(nodeDef) && isMultiple(nodeDef)
export const isAttributeComposite = (nodeDef) =>
  [nodeDefType.coordinate, nodeDefType.date, nodeDefType.file, nodeDefType.taxon, nodeDefType.time].includes(
    getType(nodeDef)
  )

export const isBoolean = isType(nodeDefType.boolean)
export const isCode = isType(nodeDefType.code)
export const isCoordinate = isType(nodeDefType.coordinate)
export const isDate = isType(nodeDefType.date)
export const isDecimal = isType(nodeDefType.decimal)
export const isFile = isType(nodeDefType.file)
export const isInteger = isType(nodeDefType.integer)
export const isTaxon = isType(nodeDefType.taxon)
export const isText = isType(nodeDefType.text)
export const isTime = isType(nodeDefType.time)

export const isReadOnly = getProp(propKeys.readOnly, false)
export const isHidden = getProp(propKeys.hidden, false)

export const getLayout = getProp(propKeys.layout, {})

export const isDeleted = ObjectUtils.isKeyTrue(keys.deleted)

export const getDescriptions = getProp(propKeys.descriptions, {})

export const isEnumerate = ObjectUtils.isPropTrue(propKeys.enumerate)

// boolean
export const getLabelValue = getProp(propKeys.labelValue, booleanLabelValues.trueFalse)
export const isBooleanLabelYesNo = (nodeDef) =>
  isBoolean(nodeDef) && getProp(propKeys.labelValue, booleanLabelValues.trueFalse)(nodeDef) === booleanLabelValues.yesNo
// code
export const getCategoryUuid = getProp(propKeys.categoryUuid)
// coordinate
export const isAllowOnlyDeviceCoordinate = ObjectUtils.isPropTrue(propKeys.allowOnlyDeviceCoordinate)
export const isAccuracyIncluded = ObjectUtils.isPropTrue(propKeys.includeAccuracy)
export const isAltitudeIncluded = ObjectUtils.isPropTrue(propKeys.includeAltitude)
export const isAltitudeAccuracyIncluded = ObjectUtils.isPropTrue(propKeys.includeAltitudeAccuracy)
export const getCoordinateAdditionalFields = NodeDefs.getCoordinateAdditionalFields
// decimal
export const getMaxNumberDecimalDigits = (nodeDef) => {
  const decimalDigits = getProp(propKeys.maxNumberDecimalDigits, NaN)(nodeDef)
  return A.isEmpty(decimalDigits) ? NaN : Number(decimalDigits)
}
// file
export const isNumberOfFilesEnabled = isMultiple
export const getMaxFileSize = (nodeDef) => Number(getProp(propKeys.maxFileSize, MAX_FILE_SIZE_DEFAULT)(nodeDef))
export const getFileType = getProp(propKeys.fileType, fileTypeValues.other)
// taxon
export const getTaxonomyUuid = getProp(propKeys.taxonomyUuid)
export const getVernacularNameLabels = getProp(propKeys.vernacularNameLabels, {})
export const getVernacularNameLabel = (lang) => (nodeDef) => getVernacularNameLabels(nodeDef)[lang]
export const getVisibleFields = (nodeDef) => {
  const visibleFieldsDefault = visibleFieldsDefaultByType[getType(nodeDef)]
  return getProp(propKeys.visibleFields, visibleFieldsDefault)(nodeDef)
}
// text
export const getTextInputType = getProp(propKeys.textInputType, textInputTypes.singleLine)
export const getTextTransform = getProp(propKeys.textTransform, textTransformValues.none)
export const getTextTransformFunction = (nodeDef) =>
  TextUtils.transform({ transformFunction: getTextTransform(nodeDef) })

// ==== READ meta
export const getMeta = R.propOr({}, keys.meta)
export const getMetaHierarchy = R.pathOr([], [keys.meta, metaKeys.h])

// Utils
export const getLabel = (nodeDef, lang, type = NodeDefLabelTypes.label, defaultToName = true) => {
  let firstPart = ''
  const name = getName(nodeDef)

  if (type === NodeDefLabelTypes.name) {
    firstPart = name
  } else {
    const label = R.path([keys.props, propKeys.labels, lang], nodeDef)

    if (!StringUtils.isBlank(label)) {
      if (type === NodeDefLabelTypes.label) {
        firstPart = label
      } else if (type === NodeDefLabelTypes.labelAndName) {
        firstPart = `${label} [${name}]`
      }
    }
  }
  // default to name
  if (StringUtils.isBlank(firstPart) && defaultToName) {
    firstPart = name
  }

  const suffix = isVirtual(nodeDef) ? ' (V)' : isAnalysis(nodeDef) && isAttribute(nodeDef) ? ' (C)' : ''

  return firstPart + suffix
}
export const getLabelWithType = ({ nodeDef, lang, type }) => getLabel(nodeDef, lang, type)

export const getDescription = (lang) => (nodeDef) => R.propOr('', lang, getDescriptions(nodeDef))

export const getCycleFirst = R.pipe(getCycles, R.head)

export const isInCycle = (cycle) => (nodeDef) => getCycles(nodeDef).includes(cycle)

export const isAncestorOf = (nodeDefDescendant) => (nodeDef) =>
  R.startsWith([...getMetaHierarchy(nodeDef), getUuid(nodeDef)], getMetaHierarchy(nodeDefDescendant))

export const isDescendantOf = (nodeDefAncestor) => (nodeDef) => {
  const hAncestor = [...getMetaHierarchy(nodeDefAncestor), getUuid(nodeDefAncestor)]
  return R.startsWith(hAncestor, getMetaHierarchy(nodeDef))
}

// Advanced props

export const getPropsAdvanced = R.propOr({}, keys.propsAdvanced)
export const getPropsAdvancedDraft = R.propOr({}, keys.propsAdvancedDraft)

export const getPropAdvanced = (prop, defaultTo = null) =>
  R.pipe(getPropsAdvanced, R.pathOr(defaultTo, prop.split('.')))

export const getPropAdvancedDraft = (prop, defaultTo = null) =>
  R.pipe(getPropsAdvancedDraft, R.pathOr(defaultTo, prop.split('.')))

export const getPropOrDraftAdvanced =
  (prop, defaultTo = null) =>
  (nodeDef) =>
    getPropAdvancedDraft(prop, getPropAdvanced(prop, defaultTo)(nodeDef))(nodeDef)

export const getAllPropsAndAllPropsDraft =
  ({ backup = false }) =>
  (nodeDef) => {
    const { props, propsDraft } = ObjectUtils.getPropsAndPropsDraft({ backup })(nodeDef)
    const propsAdvanced = getPropsAdvanced(nodeDef)
    const propsAdvancedDraft = getPropsAdvancedDraft(nodeDef)
    return {
      props,
      propsDraft,
      propsAdvanced: backup ? propsAdvanced : {},
      propsAdvancedDraft: backup ? propsAdvancedDraft : { ...propsAdvanced, ...propsAdvancedDraft },
    }
  }

export const hasAdvancedPropsDraft = (nodeDef) => R.prop(keys.draftAdvanced, nodeDef) === true
export const hasAdvancedPropsApplicableDraft = (nodeDef) => R.prop(keys.draftAdvancedApplicable, nodeDef) === true
export const hasAdvancedPropsDefaultValuesDraft = (nodeDef) => R.prop(keys.draftAdvancedDefaultValues, nodeDef) === true
export const hasAdvancedPropsValidationsDraft = (nodeDef) => R.prop(keys.draftAdvancedValidations, nodeDef) === true
const isPropAdvanced = (key) => Object.keys(keysPropsAdvanced).includes(key)

export const getDefaultValues = getPropAdvanced(keysPropsAdvanced.defaultValues, [])
export const hasDefaultValues = R.pipe(getDefaultValues, R.isEmpty, R.not)
export const isDefaultValueEvaluatedOneTime = getPropAdvanced(keysPropsAdvanced.defaultValueEvaluatedOneTime, false)

export const getValidations = getPropAdvanced(keysPropsAdvanced.validations, {})
export const getValidationExpressions = R.pipe(getValidations, NodeDefValidations.getExpressions)

export const getApplicable = getPropAdvanced(keysPropsAdvanced.applicable, [])

export const getAllExpressions = (nodeDef) => {
  const nodeDefExpressions = [
    ...getDefaultValues(nodeDef),
    ...getValidationExpressions(nodeDef),
    ...getApplicable(nodeDef),
  ]
  const expressions = nodeDefExpressions.reduce((acc, nodeDefExpression) => {
    ArrayUtils.addIfNotEmpty(NodeDefExpression.getExpression(nodeDefExpression))(acc)
    ArrayUtils.addIfNotEmpty(NodeDefExpression.getApplyIf(nodeDefExpression))(acc)
    return acc
  }, [])
  ArrayUtils.addIfNotEmpty(getItemsFilter(nodeDef))(expressions)
  return expressions
}

export const isExcludedInClone = getPropAdvanced(keysPropsAdvanced.excludedInClone, false)

// code and taxon
export const getItemsFilter = getPropAdvanced(keysPropsAdvanced.itemsFilter, '')

// Advanced props - Analysis
export const getFormula = getPropAdvanced(keysPropsAdvanced.formula, [])

export const getParentCodeDefUuid = getProp(propKeys.parentCodeDefUuid)

export const getChainUuid = getPropOrDraftAdvanced(keysPropsAdvanced.chainUuid, null)

export const getChainIndex = getPropOrDraftAdvanced(keysPropsAdvanced.index, 0)

export const isActive = getPropAdvanced(keysPropsAdvanced.active, false)
export const getScript = getPropOrDraftAdvanced(keysPropsAdvanced.script, '')

export const getAggregateFunctions = getPropOrDraftAdvanced(keysPropsAdvanced.aggregateFunctions, {})
export const getAggregateFunctionByUuid = (uuid) => R.pipe(getAggregateFunctions, R.propOr(null, uuid))

// READ Analysis
export const isAnalysis = ObjectUtils.isKeyTrue(keys.analysis)
export const isVirtual = ObjectUtils.isKeyTrue(keys.virtual)
export const isReadOnlyOrAnalysis = (nodeDef) => isReadOnly(nodeDef) || isAnalysis(nodeDef)

export const isBaseUnit = (nodeDef) => Boolean(getPropOrDraftAdvanced(keysPropsAdvanced.isBaseUnit, false)(nodeDef))
export const isSampling = (nodeDef) => Boolean(getPropOrDraftAdvanced(keysPropsAdvanced.isSampling, false)(nodeDef))
export const hasAreaBasedEstimated = (nodeDef) =>
  Boolean(getPropOrDraftAdvanced(keysPropsAdvanced.hasAreaBasedEstimated, false)(nodeDef))
export const getAreaBasedEstimatedOf = getPropOrDraftAdvanced(keysPropsAdvanced.areaBasedEstimatedOf, null)
export const isAreaBasedEstimatedOf = (nodeDef) => Boolean(getAreaBasedEstimatedOf(nodeDef))

// ==== CREATE

export const newNodeDef = (
  nodeDefParent,
  type,
  cycles,
  props,
  propsAdvanced = {},
  analysis = false,
  virtual = false
) => ({
  [keys.uuid]: uuidv4(),
  [keys.parentUuid]: getUuid(nodeDefParent),
  [keys.type]: type,
  [keys.props]: {
    ...props,
    [propKeys.cycles]: cycles,
  },
  [keys.propsAdvanced]: {
    ...propsAdvanced,
  },
  [keys.meta]: {
    [metaKeys.h]: nodeDefParent ? [...getMetaHierarchy(nodeDefParent), getUuid(nodeDefParent)] : [],
  },
  [keys.analysis]: analysis,
  [keys.virtual]: virtual,
  [keys.temporary]: true,
})

// ==== UPDATE

export const assocDeleted = R.assoc(keys.deleted)

export const assocParentUuid = R.assoc(keys.parentUuid)
export const assocMetaHierarchy = R.assocPath([keys.meta, metaKeys.h])
export const { mergeProps } = ObjectUtils
const assocPropsAdvanced = R.assoc(keys.propsAdvanced)
export const mergePropsAdvanced = (propsAdvanced) => (nodeDef) =>
  R.pipe(getPropsAdvanced, R.mergeLeft(propsAdvanced), (propsAdvancedUpdated) =>
    assocPropsAdvanced(propsAdvancedUpdated, nodeDef)
  )(nodeDef)
export const assocValidations = (validations) => mergePropsAdvanced({ [keysPropsAdvanced.validations]: validations })
export const dissocTemporary = R.dissoc(keys.temporary)
export const assocProp = ({ key, value }) =>
  isPropAdvanced(key) ? mergePropsAdvanced({ [key]: value }) : mergeProps({ [key]: value })
export const assocCycles = (cycles) => assocProp({ key: propKeys.cycles, value: cycles })
export const assocExcludedInClone = (value) => assocProp({ key: keysPropsAdvanced.excludedInClone, value })
export const assocLabels = (labels) => assocProp({ key: propKeys.labels, value: labels })
export const assocLabel =
  ({ label, lang }) =>
  (nodeDef) =>
    assocLabels({ ...getLabels(nodeDef), [lang]: label })(nodeDef)

export const assocDescriptions = (descriptions) => assocProp({ key: propKeys.descriptions, value: descriptions })

export const dissocEnumerate = ObjectUtils.dissocProp(propKeys.enumerate)
export const cloneIntoEntityDef =
  ({ nodeDefParent, clonedNodeDefName }) =>
  (nodeDef) =>
    newNodeDef(
      nodeDefParent,
      getType(nodeDef),
      [...getCycles(nodeDef)],
      { ...ObjectUtils.clone(getProps(nodeDef)), [propKeys.name]: clonedNodeDefName },
      ObjectUtils.clone(getPropsAdvanced(nodeDef)),
      isAnalysis(nodeDef)
    )

export const changeParentEntity =
  ({ targetParentNodeDef }) =>
  (nodeDef) => {
    const targetParentNodeDefUuid = getUuid(targetParentNodeDef)
    return {
      ...nodeDef,
      [keys.parentUuid]: targetParentNodeDefUuid,
      [keys.meta]: {
        ...getMeta(nodeDef),
        [metaKeys.h]: [...getMetaHierarchy(targetParentNodeDef), targetParentNodeDefUuid],
      },
    }
  }

export const convertToType =
  ({ toType }) =>
  (nodeDef) => {
    const propsUpdated = R.pick(commonAttributePropsKeys)(getProps(nodeDef))
    const propsAdvancedUpdated = R.pick(commonAttributePropsAdvancedKeys)(getPropsAdvanced(nodeDef))

    const layout = getLayout(nodeDef)
    const layoutUpdated = Object.entries(layout).reduce((acc, [cycleKey, cycleLayout]) => {
      acc[cycleKey] = R.pick(NodeDefLayout.commonAttributeKeys)(cycleLayout)
      return acc
    }, {})
    propsUpdated[propKeys.layout] = layoutUpdated

    const nodeDefUpdated = {
      ...nodeDef,
      [keys.type]: toType,
      [keys.props]: propsUpdated,
      [keys.propsAdvanced]: propsAdvancedUpdated,
    }
    return nodeDefUpdated
  }

// layout
export const assocLayout = (layout) => ObjectUtils.setProp(propKeys.layout, layout)

export const updateLayout = (updateFn) => (nodeDef) => {
  const layout = getLayout(nodeDef)
  const layoutUpdated = updateFn(layout)
  return assocLayout(layoutUpdated)(nodeDef)
}

export const updateLayoutProp = ({ cycle, prop, value }) =>
  updateLayout(NodeDefLayout.assocLayoutProp(cycle, prop, value))

export const copyLayout =
  ({ cycleFrom, cyclesTo }) =>
  (nodeDef) =>
    updateLayout((layout) => {
      const layoutCycle = NodeDefLayout.getLayoutCycle(cycleFrom)(nodeDef)
      const layoutUpdated = cyclesTo
        .filter((cycleKey) => cycleKey !== cycleFrom)
        .reduce((layoutAcc, cycleKey) => NodeDefLayout.assocLayoutCycle(cycleKey, layoutCycle)(layoutAcc), layout)
      return layoutUpdated
    })(nodeDef)

/**
 * It keeps only cycleToKeep information and moves it to cycleTarget.
 * (it does side effect on the specified nodeDef).
 *
 * @param {!object} params - The function parameters.
 * @param {!string} params.cycleToKeep - Id of source cycle to keep.
 * @param {!string} params.cycleTarget - Id of target cycle.
 * @returns {object} - Returns the nodeDef specified in parameters (it does side effect).
 */
export const keepOnlyOneCycle =
  ({ cycleToKeep, cycleTarget }) =>
  (nodeDef) => {
    nodeDef.props[propKeys.cycles] = [cycleTarget]
    const nodeDefProps = nodeDef[keys.props]
    const layoutForCycle = nodeDefProps[propKeys.layout]?.[cycleToKeep]

    if (Objects.isEmpty(layoutForCycle)) {
      delete nodeDefProps[propKeys.layout]
    } else {
      nodeDefProps[propKeys.layout] = { [cycleTarget]: layoutForCycle }
    }
    return nodeDef
  }

// ==== UTILS
export const canNodeDefBeMultiple = (nodeDef) =>
  // Entity def but not root
  (isEntity(nodeDef) && !isRoot(nodeDef)) ||
  // Attribute def but not analysis
  (!isAnalysis(nodeDef) &&
    R.includes(getType(nodeDef), [
      nodeDefType.decimal,
      nodeDefType.code,
      nodeDefType.file,
      nodeDefType.integer,
      nodeDefType.text,
    ]))

export const canNodeDefTypeBeKey = (type) =>
  R.includes(type, [
    nodeDefType.date,
    nodeDefType.decimal,
    nodeDefType.code,
    nodeDefType.integer,
    nodeDefType.taxon,
    nodeDefType.text,
    nodeDefType.time,
  ])

export const canNodeDefBeKey = (nodeDef) => !isAnalysis(nodeDef) && canNodeDefTypeBeKey(getType(nodeDef))

export const canHaveDefaultValue = (nodeDef) =>
  isSingleAttribute(nodeDef) &&
  R.includes(getType(nodeDef), [
    nodeDefType.boolean,
    nodeDefType.code,
    nodeDefType.coordinate,
    nodeDefType.date,
    nodeDefType.decimal,
    nodeDefType.integer,
    nodeDefType.taxon,
    nodeDefType.text,
    nodeDefType.time,
  ])

export const belongsToAllCycles = (cycles) => (nodeDef) => R.isEmpty(R.difference(cycles, getCycles(nodeDef)))
export const canBeExcludedInClone = (nodeDef) => !isRoot(nodeDef) && !isKey(nodeDef)

const isEntityAndNotRoot = (nodeDef) => isEntity(nodeDef) && !isRoot(nodeDef)
export const isDisplayAsEnabled = isEntityAndNotRoot
export const isDisplayInEnabled = isEntityAndNotRoot

export const canMultipleAttributeBeAggregated = (nodeDef) =>
  [nodeDefType.code, nodeDefType.decimal, nodeDefType.integer, nodeDefType.text].includes(getType(nodeDef))

export const canNameBeEdited = (nodeDef) => !isSampling(nodeDef)
export const canBeHiddenInMobile = (nodeDef) =>
  !isKey(nodeDef) && !NodeDefValidations.isRequired(getValidations(nodeDef))

export const canIncludeInMultipleEntitySummary = (cycle) => (nodeDef) =>
  !isKey(nodeDef) &&
  !isMultiple(nodeDef) &&
  !isFile(nodeDef) &&
  NodeDefLayout.canIncludeInMultipleEntitySummary(cycle)(nodeDef)

export const clearNotApplicableProps = (cycle) => (nodeDef) => {
  let nodeDefUpdated = nodeDef
  // clear hidden in mobile if not applicable
  if (!canBeHiddenInMobile(nodeDefUpdated) && NodeDefLayout.isHiddenInMobile(cycle)(nodeDef)) {
    nodeDefUpdated = updateLayoutProp({
      cycle,
      prop: NodeDefLayout.keys.hiddenInMobile,
      value: false,
    })(nodeDefUpdated)
  }
  // clear inclulde in multiple entity summary if not applicable
  if (
    !canIncludeInMultipleEntitySummary(cycle)(nodeDefUpdated) &&
    NodeDefLayout.isIncludedInMultipleEntitySummary(getLayout(nodeDefUpdated))
  ) {
    nodeDefUpdated = updateLayoutProp({
      cycle,
      prop: NodeDefLayout.keys.includedInMultipleEntitySummary,
      value: false,
    })(nodeDefUpdated)
  }
  if (!canBeExcludedInClone(nodeDefUpdated) && isExcludedInClone(nodeDefUpdated)) {
    nodeDefUpdated = assocExcludedInClone(false)(nodeDefUpdated)
  }
  return nodeDefUpdated
}

export const canHaveMobileProps = (cycle) => (nodeDef) =>
  canBeHiddenInMobile(nodeDef) || canIncludeInMultipleEntitySummary(cycle)(nodeDef)
