import * as R from 'ramda';
import toSnakeCase from 'to-snake-case';
import Survey from '../../core/survey/survey';
import NodeDef, { INodeDef } from '../../core/survey/nodeDef';
import { INodeDefs } from '../../core/survey/_survey/surveyNodeDefs';

const viewSuffix = '_view'
const tablePrefix = 'data_'
const parentTablePrefix = '_$parent$_'

const composeTableName = (nodeDefName: string, nodeDefParentName = '') => `${tablePrefix}${nodeDefParentName}${nodeDefName}`

const getTableName = (nodeDef: INodeDef, nodeDefParent?: INodeDef) => {
  const nodeDefName = NodeDef.getName(nodeDef)
  const nodeDefParentName = NodeDef.getName(nodeDefParent)

  return NodeDef.isEntity(nodeDef)
    ? composeTableName(nodeDefName)
    : NodeDef.isMultiple(nodeDef)
      ? composeTableName(nodeDefName, nodeDefParentName + parentTablePrefix)
      : composeTableName(nodeDefParentName)
}

const getViewName = (nodeDef: INodeDef, nodeDefParent?: INodeDef) => getTableName(nodeDef, nodeDefParent) + viewSuffix

const cols = {
  [NodeDef.nodeDefType.code]: ['code', 'label'],
  [NodeDef.nodeDefType.taxon]: ['code', 'scientific_name'], //?, 'vernacular_names?'],
  [NodeDef.nodeDefType.file]: ['file_uuid', 'file_name'],
}

const getCols: (nodeDef: INodeDef) => any[] = nodeDef => R.propOr([], NodeDef.getType(nodeDef), cols)

const getDefaultColumnName = (nodeDef: INodeDef) => NodeDef.isEntity(nodeDef)
  ? `${NodeDef.getName(nodeDef)}_uuid`
  : `${NodeDef.getName(nodeDef)}`

const getColNames = (nodeDef: INodeDef) => {
  const cols = getCols(nodeDef)
  return R.isEmpty(cols)
    ? [getDefaultColumnName(nodeDef)]
    : cols.map( (col: string) => NodeDef.getName(nodeDef) + '_' + col )
}

const getColName: (x: any) => string = R.pipe(getColNames, R.head)

const getColNamesByUuids = (nodeDefUuidCols: readonly string[]) => (survey: INodeDefs) => R.reduce(
  (cols: string[], uuid: string) => R.pipe(
    Survey.getNodeDefByUuid(uuid),
    getColNames,
    R.concat(cols),
  )(survey),
  [],
  nodeDefUuidCols
)

const extractColName = (nodeDef: INodeDef, col: string) => R.replace(
  //TODO check if toSnakeCase is necessary : if col names are snaked when creating tables
  toSnakeCase(NodeDef.getName(nodeDef)) + '_',
  '',
  col
)

const extractNodeDefNameFromViewName: (s: string) => string = R.pipe(
  R.defaultTo(''),
  R.split(tablePrefix),
  R.last,
  R.split(viewSuffix),
  R.head,
  R.split(parentTablePrefix),
  R.last
)

export default {
  getTableName,
  getViewName,

  getColNames,
  getColName,
  getColNamesByUuids,

  extractColName,
  extractNodeDefNameFromViewName,
};
