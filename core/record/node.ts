import * as R from 'ramda';
import ObjectUtils from '../objectUtils';
import StringUtils from '../stringUtils';
import { uuidv4 } from './../uuid';
import Validation from '../validation/validation';
import NodeDef from '../survey/nodeDef';

const keys = {
  id: ObjectUtils.keys.id,
  uuid: ObjectUtils.keys.uuid,
  parentUuid: ObjectUtils.keys.parentUuid,
  dateCreated: ObjectUtils.keys.dateCreated,
  dateModified: ObjectUtils.keys.dateModified,
  recordUuid: 'recordUuid',
  nodeDefUuid: ObjectUtils.keys.nodeDefUuid,
  value: 'value',
  meta: 'meta',
  placeholder: 'placeholder',

  created: 'created',
  updated: 'updated',
  deleted: 'deleted',
  dirty: 'dirty' //modified by the user but not persisted yet
}

const metaKeys = {
  hierarchy: 'h', //ancestor nodes uuids hierarchy
  childApplicability: 'childApplicability', //applicability by child def uuid
  defaultValue: 'defaultValue', //true if default value has been applied, false if the value is user defined
  hierarchyCode: 'hCode', //hierarchy of code attribute ancestors (according to the parent code defs specified)
}

export interface INodeMeta {
  h: INode[]; // hierarchy
  childApplicability?: any;
  defaultValue?: any;
  hCode?: any; // hierarchyCode
}
export interface INode {
  uuid: string;
  nodeDefUuid: string;
  recordUuid: string;
  parentUuid: string;
  value: string;
  meta: INodeMeta;

  id?: string;
  dateCreated?: string;
  dateModified?: string;
  placeholder?: boolean;

  created?: string;
  updated?: string;
  deleted?: string
  dirty?: boolean;
}



const valuePropKeys = {
  // generic code (can be used by taxon or categoryItem)
  code: 'code',

  // code
  itemUuid: 'itemUuid',

  // coordinate
  x: 'x',
  y: 'y',
  srs: 'srs',

  // file
  fileUuid: 'fileUuid',
  fileName: 'fileName',
  fileSize: 'fileSize',

  // taxon
  taxonUuid: 'taxonUuid',
  vernacularNameUuid: 'vernacularNameUuid',
  scientificName: 'scientificName',
  vernacularName: 'vernacularName',
}

/**
 * ======
 * CREATE
 * ======
 */


const newNode: (nodeDefUuid: string, recordUuid: string, parentNode?: INode | null, value?: any) => INode
= (nodeDefUuid, recordUuid, parentNode = null, value = null) => ({
  uuid: uuidv4(),
  nodeDefUuid: nodeDefUuid,
  recordUuid: recordUuid,
  parentUuid: getUuid(parentNode),
  value: value,
  meta: {
    // hierarchy:
    h: parentNode
      ? R.append(getUuid(parentNode), getHierarchy(parentNode))
      : []
  }
})

const newNodePlaceholder: (nodeDef: INode, parentNode: INode, value?: any) => INode
= (nodeDef, parentNode, value = null) => ({
  ...newNode(NodeDef.getUuid(nodeDef), getRecordUuid(parentNode), parentNode, value),
  placeholder: true
})

/**
 * ======
 * READ
 * ======
 */

const getUuid = ObjectUtils.getUuid

const getParentUuid = ObjectUtils.getParentUuid

const getRecordUuid: (obj: INode) => string = R.prop(keys.recordUuid) as (obj: INode) => string

const getValue: (node?: any, defaultValue?: any) => any
= (node = {}, defaultValue = {}) =>
  R.propOr(defaultValue, keys.value, node)

const getValueProp: (prop: string, defaultValue?: any) => any
= (prop, defaultValue = null) => R.pipe(
  getValue,
  R.propOr(defaultValue, prop),
)

export const getNodeDefUuid: (x: any) => string = ObjectUtils.getNodeDefUuid

const getNodeDefUuids: (nodes: any) => string[] = nodes => R.pipe(
  R.keys,
  R.map(key => getNodeDefUuid(nodes[key])),
  R.uniq
)(nodes)

const getMeta: (obj: INode) => INodeMeta | {} = R.propOr({}, keys.meta)

const getHierarchy = R.pathOr([], [keys.meta, metaKeys.hierarchy])

const isDescendantOf = ancestor =>
  node => R.includes(
    getUuid(ancestor),
    getHierarchy(node),
  )

/**
 * ======
 * UPDATE
 * ======
 */
const mergeMeta = meta => node => R.pipe(
  getMeta,
  R.mergeLeft(meta),
  metaUpdated => R.assoc(keys.meta, metaUpdated)(node)
)(node)

/**
 * ======
 * UTILS
 * ======
 */
const isValueBlank = node => {
  const value = getValue(node, null)

  if (R.isNil(value))
    return true

  if (R.is(String, value))
    return StringUtils.isBlank(value)

  return R.isEmpty(value)
}

export default {
  keys,
  valuePropKeys,
  metaKeys,

  // ==== CREATE
  newNode,
  newNodePlaceholder,

  // ==== READ
  getUuid,
  getParentUuid,
  getRecordUuid,
  getValue,
  getNodeDefUuid,

  getNodeDefUuids,

  isPlaceholder: R.propEq(keys.placeholder, true),
  isCreated: R.propEq(keys.created, true),
  isUpdated: R.propEq(keys.updated, true),
  isDeleted: R.propEq(keys.deleted, true),
  isDirty: R.propEq(keys.dirty, true),
  isRoot: R.pipe(getParentUuid, R.isNil),
  isEqual: ObjectUtils.isEqual,

  getValidation: Validation.getValidation,

  // ==== READ metadata
  getMeta,
  isChildApplicable: childDefUuid => R.pathOr(true, [keys.meta, metaKeys.childApplicability, childDefUuid]),
  isDefaultValueApplied: R.pathOr(false, [keys.meta, metaKeys.defaultValue]),
  isDescendantOf,
  getHierarchy,
  // code metadata
  getHierarchyCode: R.pathOr([], [keys.meta, metaKeys.hierarchyCode]),

  // ==== UPDATE
  assocValue: R.assoc(keys.value),
  assocMeta: R.assoc(keys.meta),
  assocValidation: Validation.assocValidation,
  mergeMeta,

  // ==== UTILS
  isValueBlank,

  // ====== Node Value extractor

  // date
  getDateYear: R.pipe(
    R.partialRight(getValue, ['//']),
    R.split('/'),
    x => x[2] || '',
    StringUtils.trim,
  ),
  getDateMonth: R.pipe(
    R.partialRight(getValue, ['//']),
    R.split('/'),
    x => x[1] || '',
    StringUtils.trim
  ),
  getDateDay: R.pipe(
    R.partialRight(getValue, ['//']),
    R.split('/'),
    x => x[0] || '',
    StringUtils.trim
  ),

  // time
  getTimeHour: R.pipe(
    R.partialRight(getValue, [':']),
    R.split(':'),
    x => x[0] || '',
    StringUtils.trim
  ),
  getTimeMinute: R.pipe(
    R.partialRight(getValue, [':']),
    R.split(':'),
    x => x[1] || '',
    StringUtils.trim
  ),

  // coordinate
  getCoordinateX: getValueProp(valuePropKeys.x),
  getCoordinateY: getValueProp(valuePropKeys.y),
  getCoordinateSrs: (node, defaultValue = null) => getValueProp(valuePropKeys.srs, defaultValue)(node),

  // file
  getFileName: getValueProp(valuePropKeys.fileName, ''),
  getFileUuid: getValueProp(valuePropKeys.fileUuid, ''),

  // code
  getCategoryItemUuid: getValueProp(valuePropKeys.itemUuid),

  // taxon
  getTaxonUuid: getValueProp(valuePropKeys.taxonUuid),
  getVernacularNameUuid: getValueProp(valuePropKeys.vernacularNameUuid),
  getScientificName: getValueProp(valuePropKeys.scientificName, ''),
  getVernacularName: getValueProp(valuePropKeys.vernacularName, ''),
};
