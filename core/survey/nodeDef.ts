import * as R from 'ramda';
import { uuidv4 } from '../uuid';
import ObjectUtils from '../objectUtils';
import NodeDefValidations from './nodeDefValidations';
import StringUtils from '../stringUtils';
import { ILocalizedDict } from './taxon';
import { ILayout } from './nodeDefLayout';
import {Maybe} from '../../common/types'
import { SurveyCycleKey } from './_survey/surveyInfo';

// ======== NODE DEF PROPERTIES

export interface INodeProps {
  cycles?: string[];

  applicable?: string;
  defaultValues?: any; // TODO
  descriptions?: ILocalizedDict;
  key?: any;
  labels?: ILocalizedDict;
  multiple?: boolean;
  name?: string;
  readOnly?: any;
  validations?: any;

  //code
  categoryUuid?: any;
  parentCodeDefUuid?: any;
  //taxon
  taxonomyUuid?: any;

  layout?: ILayout; // TODO: should this be here?
}
type UUID = string
export interface INodeDef {
  id?: number | string; // TODO what is id

  uuid: UUID;
  parentUuid?: UUID;
  type: string; // TODO are types always strings?
  analysis: string | boolean; // TODO should probably be only string or only boolean
  props: INodeProps;

  meta?: {};
  draftAdvanced?: boolean;
  deleted?: boolean;
  published?: boolean;
  draft?: boolean

  dateCreated?: string;
  dateModified?: string;
}

export type NodeDefType
= 'integer'
| 'decimal'
| 'text'
| 'date'
| 'time'
| 'boolean'
| 'code'
| 'coordinate'
| 'taxon'
| 'file'
| 'entity'

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

const keys = {
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

const propKeys = {
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

const maxKeyAttributes = 3

// ==== CREATE

const newNodeDef: (parentUuid: UUID, type: string, cycle: string, props: INodeProps, analysis?: boolean) => INodeDef
= (parentUuid, type, cycle, props, analysis = false) => ({
  uuid: uuidv4(),
  parentUuid,
  type,
  analysis,
  props: {
    ...props,
    cycles: [cycle]
  },
})

// ==== READ
// export type NodeDef = Record<string, string>
export type NodeDefPredicate = (obj?: INodeDef) => boolean

const getType: (obj?: INodeDef) => string = R.prop(keys.type) as (obj?: INodeDef) => string
const getName: (obj?: INodeDef) => string = ObjectUtils.getProp(propKeys.name, '')
const getParentUuid: (obj?: INodeDef) => Maybe<string> = ObjectUtils.getParentUuid
const getCycles: (obj?: INodeDef) => string[] = ObjectUtils.getProp(propKeys.cycles, [])

const isKey: NodeDefPredicate = R.pipe(ObjectUtils.getProp(propKeys.key), R.equals(true))
const isRoot: NodeDefPredicate = R.pipe(getParentUuid, R.isNil)
const isMultiple: NodeDefPredicate = R.pipe(ObjectUtils.getProp(propKeys.multiple), R.equals(true))
const isSingle: NodeDefPredicate = R.pipe(isMultiple, R.not)

const isType: (type: string) => NodeDefPredicate = (type) => R.pipe(getType, R.equals(type))

const isEntity: NodeDefPredicate = isType(nodeDefType.entity)
const isSingleEntity: NodeDefPredicate = (nodeDef) => isEntity(nodeDef) && isSingle(nodeDef)
const isMultipleEntity: NodeDefPredicate = (nodeDef) => isEntity(nodeDef) && isMultiple(nodeDef)
const isEntityOrMultiple: NodeDefPredicate = (nodeDef) => isEntity(nodeDef) || isMultiple(nodeDef)

const isAttribute: NodeDefPredicate = R.pipe(isEntity, R.not)
const isSingleAttribute: NodeDefPredicate = (nodeDef) => isAttribute(nodeDef) && isSingle(nodeDef)
const isMultipleAttribute: NodeDefPredicate = (nodeDef) => isAttribute(nodeDef) && isMultiple(nodeDef)

const isBoolean: NodeDefPredicate = isType(nodeDefType.boolean)
const isCode: NodeDefPredicate = isType(nodeDefType.code)
const isCoordinate: NodeDefPredicate = isType(nodeDefType.coordinate)
const isDecimal: NodeDefPredicate = isType(nodeDefType.decimal)
const isFile: NodeDefPredicate = isType(nodeDefType.file)
const isInteger: NodeDefPredicate = isType(nodeDefType.integer)
const isTaxon: NodeDefPredicate = isType(nodeDefType.taxon)

const isPublished:  NodeDefPredicate = R.propEq(keys.published, true)
const isDeleted: NodeDefPredicate= R.propEq(keys.deleted, true)
const isAnalysis: NodeDefPredicate = R.propEq(keys.analysis, true)

const getLabel = (nodeDef, lang: string | number) => {
  const label = R.path([keys.props, propKeys.labels, lang], nodeDef)
  return StringUtils.isBlank(label)
    ? getName(nodeDef)
    : label
}

const getDefaultValues: (nodeDef) => any[] = ObjectUtils.getProp(propKeys.defaultValues, [])
const hasDefaultValues = R.pipe(getDefaultValues, R.isEmpty, R.not)

const getValidations = ObjectUtils.getProp(propKeys.validations, {})

// ==== READ meta
const getMetaHierarchy = R.pathOr([], [keys.meta, metaKeys.h])

const getParentCodeDefUuid = ObjectUtils.getProp(propKeys.parentCodeDefUuid)

// ==== UPDATE

// ==== UTILS
const canNodeDefBeMultiple = (nodeDef) =>
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

const canNodeDefBeKey = (nodeDef: INodeDef) => canNodeDefTypeBeKey(getType(nodeDef))

const canNodeDefTypeBeKey = (type: any) =>
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

const canHaveDefaultValue = (nodeDef) =>
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

const getDraftAdvanced: (obj: INodeDef) => string = R.prop(keys.draftAdvanced) as (obj: INodeDef) => string
export const hasAdvancedPropsDraft = R.pipe(getDraftAdvanced, R.isEmpty, R.not)

export default {
  nodeDefType,
  keys,
  propKeys,
  maxKeyAttributes,

  //CREATE
  newNodeDef,

  //READ
  getUuid: ObjectUtils.getUuid,
  getProp: ObjectUtils.getProp,
  getProps: ObjectUtils.getProps,
  isEqual: ObjectUtils.isEqual,

  getType,
  getName,
  getParentUuid,
  getLabels: ObjectUtils.getLabels,
  getLabel,
  getDescriptions: ObjectUtils.getProp(propKeys.descriptions, {}),
  getCategoryUuid: ObjectUtils.getProp(propKeys.categoryUuid),
  getParentCodeDefUuid,
  getTaxonomyUuid: ObjectUtils.getProp(propKeys.taxonomyUuid),
  getCycles,
  getCycleFirst: R.pipe(getCycles, R.head) as (x: INodeDef) => SurveyCycleKey,

  isKey,
  isMultiple,
  isSingle,
  isRoot,
  isEntity,
  isAttribute,
  isEntityOrMultiple,
  isSingleEntity,
  isMultipleEntity,
  isSingleAttribute,
  isMultipleAttribute,
  isReadOnly: ObjectUtils.getProp(propKeys.readOnly, false),

  isBoolean,
  isCode,
  isCoordinate,
  isDecimal,
  isFile,
  isInteger,
  isTaxon,

  isPublished,
  isDeleted,
  isAnalysis,

  //advanced props
  getDefaultValues,
  hasDefaultValues,
  getApplicable: ObjectUtils.getProp(propKeys.applicable, []),
  getValidations,
  getValidationExpressions: R.pipe(
    getValidations,
    NodeDefValidations.getExpressions,
  ),
  hasAdvancedPropsDraft,

  // meta
  getMetaHierarchy,

  //UTILS
  canNodeDefBeMultiple,
  canNodeDefBeKey,
  canNodeDefTypeBeKey,
  canHaveDefaultValue,
};
