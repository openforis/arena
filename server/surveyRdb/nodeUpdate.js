const R = require('ramda')
const Promise = require('bluebird')

const NodeDef = require('../../common/survey/nodeDef')
const Node = require('../../common/record/node')

const DataSchema = require('./schemaRdb/dataSchema')
const DataTable = require('./schemaRdb/dataTable')
const DataCol = require('./schemaRdb/dataCol')

const types = {insert: 'insert', update: 'update', delete: 'delete'}

const hasTable = NodeDef.isNodeDefEntityOrMultiple

const getType = (nodeDef, node) =>
  node.created && hasTable(nodeDef)
    ? types.insert
    : node.updated || node.created
    ? types.update
    : node.deleted && hasTable(nodeDef)
      ? types.delete
      : node.deleted
        ? types.update
        : null

const getColNames = (nodeDef, type) =>
  type === types.insert
    ? [DataTable.colNameUuuid, NodeDef.isNodeDefRoot(nodeDef) ? DataTable.colNameRecordUuuid : DataTable.colNameParentUuuid]
    : DataCol.getNames(nodeDef)

const getColValues = async (surveyInfo, nodeDef, node, type) =>
  type === types.insert
    ? [Node.getUuid(node), NodeDef.isNodeDefRoot(nodeDef) ? Node.getRecordUuid(node) : Node.getParentUuid(node)]
    : await DataCol.getValues(surveyInfo, nodeDef, node)

const getRowUuid = (nodeDef, node, nodeParent) =>
  hasTable(nodeDef)
    ? Node.getUuid(node)
    : Node.getUuid(nodeParent)

const toUpdates = async (surveyInfo, nodes, nodeDefs) => {
  const updates = await Promise.all(
    R.values(nodes).map(async node => {
      const nodeDef = nodeDefs[Node.getNodeDefUuid(node)]
      const nodeDefParent = nodeDefs[NodeDef.getNodeDefParentUuid(nodeDef)]
      const type = getType(nodeDef, node)

      return type ? {
          type,
          schemaName: DataSchema.getName(surveyInfo.id),
          tableName: DataTable.getTableName(nodeDef, nodeDefParent),
          colNames: getColNames(nodeDef, type),
          colValues: await getColValues(surveyInfo, nodeDef, node, type),
          rowUuid: getRowUuid(nodeDef, node, nodes[Node.getParentUuid(node)])
        }
        : null
    })
  )
  return R.reject(R.isNil, updates)
}

const isType = type => R.propEq('type', type)
const isInsert = isType(types.insert)
const isUpdate = isType(types.update)
const isDelete = isType(types.delete)

module.exports = {
  isInsert,
  isUpdate,
  isDelete,
  toUpdates,
}