import * as R from 'ramda'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import * as DataTable from '../schemaRdb/dataTable'
import * as DataCol from '../schemaRdb/dataCol'

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
        ...(NodeDef.isMultipleAttribute(nodeDef) // Entity
          ? DataCol.getNames(nodeDef)
          : []),
      ]
    : DataCol.getNames(nodeDef)

const _getColValues = async (survey, cycle, nodeDef, node, type) =>
  type === types.insert
    ? [
        Node.getUuid(node),
        Node.getRecordUuid(node),
        cycle,
        Node.getParentUuid(node),
        ...(NodeDef.isMultipleAttribute(nodeDef) // Entity
          ? await Promise.all(DataCol.getValues(survey, nodeDef, node))
          : []),
      ]
    : await DataCol.getValues(survey, nodeDef, node)

const _getRowUuid = (nodeDef, node, nodeParent) =>
  _hasTable(nodeDef) ? Node.getUuid(node) : Node.getUuid(nodeParent)

const _toUpdates = async (survey, cycle, nodeDefs, nodes) => {
  const updates = await Promise.all(
    R.values(nodes).map(async node => {
      const nodeDef = nodeDefs[Node.getNodeDefUuid(node)]
      const nodeDefParent = nodeDefs[NodeDef.getParentUuid(nodeDef)]
      const type = _getType(nodeDef, node)

      return type
        ? {
            type,
            schemaName: SchemaRdb.getName(Survey.getId(survey)),
            tableName: DataTable.getName(nodeDef, nodeDefParent),
            colNames: _getColNames(nodeDef, type),
            colValues: await _getColValues(survey, cycle, nodeDef, node, type),
            rowUuid: _getRowUuid(
              nodeDef,
              node,
              nodes[Node.getParentUuid(node)],
            ),
          }
        : null
    }),
  )
  return R.reject(R.isNil, updates)
}

// ==== execution

const _update = (update, client) =>
  client.query(
    `UPDATE ${update.schemaName}.${update.tableName}
      SET ${update.colNames.map((col, i) => `${col} = $${i + 2}`).join(',')}
      WHERE uuid = $1`,
    [update.rowUuid, ...update.colValues],
  )

const _insert = (update, client) =>
  client.query(
    `INSERT INTO ${update.schemaName}.${update.tableName}
      (${update.colNames.join(',')})
      VALUES 
      (${update.colNames.map((_col, i) => `$${i + 1}`).join(',')})`,
    update.colValues,
  )

const _delete = (update, client) =>
  client.query(
    `DELETE FROM ${update.schemaName}.${update.tableName} WHERE uuid = $1`,
    update.rowUuid,
  )

const queryByType = {
  [types.delete]: _delete,
  [types.insert]: _insert,
  [types.update]: _update,
}

export const updateTable = async (survey, cycle, nodeDefs, nodes, client) => {
  const updates = await _toUpdates(survey, cycle, nodeDefs, nodes)

  await client.batch(
    updates.map(update => queryByType[update.type](update, client)),
  )
}
