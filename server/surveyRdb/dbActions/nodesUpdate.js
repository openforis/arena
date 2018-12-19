const R = require('ramda')
const Promise = require('bluebird')

const NodeDef = require('../../../common/survey/nodeDef')
const Node = require('../../../common/record/node')

const DataSchema = require('../schemaRdb/dataSchema')
const DataTable = require('../schemaRdb/dataTable')
const DataCol = require('../schemaRdb/dataCol')

const types = {insert: 'insert', update: 'update', delete: 'delete'}

// ==== parsing

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
  R.flatten(type === types.insert
    ? [
      DataTable.colNameUuuid,
      NodeDef.isNodeDefMultipleAttribute(nodeDef)
        ? [DataTable.colNameParentUuuid, ...DataCol.getNames(nodeDef)]
        //entity
        : NodeDef.isNodeDefRoot(nodeDef) ? DataTable.colNameRecordUuuid : DataTable.colNameParentUuuid
    ]
    : DataCol.getNames(nodeDef)
  )

const getColValues = async (surveyInfo, nodeDef, node, type) =>
  R.flatten(type === types.insert
    ? [
      Node.getUuid(node),
      NodeDef.isNodeDefMultipleAttribute(nodeDef)
        ? [Node.getParentUuid(node), ...await Promise.all(DataCol.getValues(surveyInfo, nodeDef, node))]
        //entity
        : NodeDef.isNodeDefRoot(nodeDef) ? Node.getRecordUuid(node) : Node.getParentUuid(node)
    ]
    : await DataCol.getValues(surveyInfo, nodeDef, node)
  )

const getRowUuid = (nodeDef, node, nodeParent) =>
  hasTable(nodeDef)
    ? Node.getUuid(node)
    : Node.getUuid(nodeParent)

const toUpdates = async (surveyInfo, nodeDefs, nodes) => {
  const updates = await Promise.all(
    R.values(nodes).map(async node => {
      const nodeDef = nodeDefs[Node.getNodeDefUuid(node)]
      const nodeDefParent = nodeDefs[NodeDef.getNodeDefParentUuid(nodeDef)]
      const type = getType(nodeDef, node)

      return type ? {
          type,
          schemaName: DataSchema.getName(surveyInfo.id),
          tableName: DataTable.getNameFromDefs(nodeDef, nodeDefParent),
          colNames: getColNames(nodeDef, type),
          colValues: await getColValues(surveyInfo, nodeDef, node, type),
          rowUuid: getRowUuid(nodeDef, node, nodes[Node.getParentUuid(node)])
        }
        : null
    })
  )
  return R.reject(R.isNil, updates)
}

// ==== execution

const isType = type => R.propEq('type', type)

const runUpdate = (update, client) =>
  client.query(
    `UPDATE ${update.schemaName}.${update.tableName}
      SET ${update.colNames.map((col, i) => `${col} = $${i + 2}`).join(',')}
      WHERE uuid = $1`,
    [update.rowUuid, ...update.colValues]
  )

const runInsert = (update, client) =>
  client.query(
    `INSERT INTO ${update.schemaName}.${update.tableName}
      (${update.colNames.join(',')})
      VALUES 
      (${update.colNames.map((col, i) => `$${i + 1}`).join(',')})`,
    update.colValues
  )

const runDelete = (update, client) =>
  client.query(
    `DELETE FROM ${update.schemaName}.${update.tableName} WHERE uuid = $1`,
    update.rowUuid
  )

const run = async (surveyInfo, nodeDefs, nodes, client) => {
  const updates = await toUpdates(surveyInfo, nodeDefs, nodes)
  await client.batch(
    updates.map(update =>
      isType(types.update)(update)
        ? runUpdate(update, client)
        : isType(types.insert)(update) ? runInsert(update, client)
        : runDelete(update, client)
    )
  )
}

module.exports = {
  run,
}