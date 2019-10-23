const R = require('ramda')

const Survey = require('../../../../core/survey/survey')
const NodeDef = require('../../../../core/survey/nodeDef')
const Node = require('../../../../core/record/node')
const SchemaRdb = require('../../../../common/surveyRdb/schemaRdb')

const DataTable = require('../schemaRdb/dataTable')
const DataCol = require('../schemaRdb/dataCol')

const types = { insert: 'insert', update: 'update', delete: 'delete' }

// ==== parsing

const _hasTable = NodeDef.isEntityOrMultiple

const _getType = (nodeDef, node) => {
  const created = Node.isCreated(node)
  const updated = Node.isUpdated(node)
  const deleted = Node.isDeleted(node)

  return created && _hasTable(nodeDef)
    ? types.insert
    : updated || created
      ? types.update
      : deleted && _hasTable(nodeDef)
        ? types.delete
        : deleted
          ? types.update
          : null
}

const _getColNames = (nodeDef, type) =>
  type === types.insert
    ? [
      DataTable.colNameUuuid,
      DataTable.colNameRecordUuuid,
      DataTable.colNameRecordCycle,
      DataTable.colNameParentUuuid,
      ...NodeDef.isMultipleAttribute(nodeDef)
        ? DataCol.getNames(nodeDef)
        //entity
        : []
    ]
    : DataCol.getNames(nodeDef)

const _getColValues = async (survey, cycle, nodeDef, node, type, client) =>
  type === types.insert
    ? [
      Node.getUuid(node),
      Node.getRecordUuid(node),
      cycle,
      Node.getParentUuid(node),
      ...NodeDef.isMultipleAttribute(nodeDef)
        ? await Promise.all(DataCol.getValues(survey, nodeDef, node, client))
        //entity
        : []
    ]
    : await DataCol.getValues(survey, nodeDef, node, client)

const _getRowUuid = (nodeDef, node, nodeParent) => _hasTable(nodeDef)
  ? Node.getUuid(node)
  : Node.getUuid(nodeParent)

const _toUpdates = async (survey, cycle, nodeDefs, nodes, client) => {
  const updates = await Promise.all(
    R.values(nodes).map(async node => {
      const nodeDef = nodeDefs[Node.getNodeDefUuid(node)]
      const nodeDefParent = nodeDefs[NodeDef.getParentUuid(nodeDef)]
      const type = _getType(nodeDef, node)

      return type ? {
          type,
          schemaName: SchemaRdb.getName(Survey.getId(survey)),
          tableName: DataTable.getName(nodeDef, nodeDefParent),
          colNames: _getColNames(nodeDef, type),
          colValues: await _getColValues(survey, cycle, nodeDef, node, type, client),
          rowUuid: _getRowUuid(nodeDef, node, nodes[Node.getParentUuid(node)])
        }
        : null
    })
  )
  return R.reject(R.isNil, updates)
}

// ==== execution

const _update = (update, client) =>
  client.query(
    `UPDATE ${update.schemaName}.${update.tableName}
      SET ${update.colNames.map((col, i) => `${col} = $${i + 2}`).join(',')}
      WHERE uuid = $1`,
    [update.rowUuid, ...update.colValues]
  )

const _insert = (update, client) =>
  client.query(
    `INSERT INTO ${update.schemaName}.${update.tableName}
      (${update.colNames.join(',')})
      VALUES 
      (${update.colNames.map((col, i) => `$${i + 1}`).join(',')})`,
    update.colValues
  )

const _delete = (update, client) =>
  client.query(
    `DELETE FROM ${update.schemaName}.${update.tableName} WHERE uuid = $1`,
    update.rowUuid
  )

const queryByType = {
  [types.delete]: _delete,
  [types.insert]: _insert,
  [types.update]: _update,
}

const updateTable = async (survey, cycle, nodeDefs, nodes, client) => {
  const updates = await _toUpdates(survey, cycle, nodeDefs, nodes, client)

  await client.batch(
    updates.map(update =>
      queryByType[update.type](update, client)
    )
  )
}

module.exports = {
  updateTable,
}