import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import * as DataTable from '../schemaRdb/dataTable'
import * as DataCol from '../schemaRdb/dataCol'
import { RdbUpdateTypes, RdbUpdates } from './RdbUpdates'

const types = RdbUpdateTypes

// ==== parsing

const _hasTable = (nodeDef) => NodeDef.isMultiple(nodeDef) || NodeDef.isRoot(nodeDef)

const _getType = (nodeDef, node) => {
  const created = Node.isCreated(node)
  const deleted = Node.isDeleted(node)
  const updated = Node.isUpdated(node)
  const withTable = _hasTable(nodeDef)

  if (withTable) {
    if (created) {
      return types.insert
    }
    if (deleted) {
      return types.delete
    }
    if (updated && NodeDef.isMultipleAttribute(nodeDef)) {
      return types.update
    }
  } else if (!deleted) {
    return types.update
  }
  return null
}

const _getValuesByColumnNameDefault = ({ survey, nodeDef, node }) => {
  const columnNames = DataCol.getNames(nodeDef)
  const columnValues = DataCol.getValues(survey, nodeDef, node)
  return columnNames.reduce((acc, columnName, index) => {
    acc[columnName] = columnValues[index]
    return acc
  }, {})
}

const _getValuesByColumnName = ({ survey, record, nodeDef, node, ancestorMultipleEntity, type }) => {
  if (type !== types.insert) {
    return _getValuesByColumnNameDefault({ survey, nodeDef, node })
  } else {
    const result = {
      [DataTable.columnNameUuid]: Node.getUuid(node),
      [DataTable.columnNameParentUuid]: Node.getUuid(ancestorMultipleEntity),
    }
    if (NodeDef.isRoot(nodeDef)) {
      Object.assign(result, {
        [DataTable.columnNameRecordUuid]: Node.getRecordUuid(node),
        [DataTable.columnNameRecordCycle]: Record.getCycle(record),
        [DataTable.columnNameRecordStep]: Record.getStep(record),
        [DataTable.columnNameRecordOwnerUuid]: Record.getOwnerUuid(record),
      })
    }
    if (NodeDef.isMultipleAttribute(nodeDef)) {
      Object.assign(result, _getValuesByColumnNameDefault({ survey, nodeDef, node }))
    }
    return result
  }
}

const _findAncestor = ({ ancestorDefUuid, node, nodes }) => {
  let currentParent = nodes[Node.getParentUuid(node)]
  while (currentParent && !Node.isRoot(currentParent) && Node.getNodeDefUuid(currentParent) !== ancestorDefUuid) {
    currentParent = nodes[Node.getParentUuid(currentParent)]
  }
  return currentParent
}

const _getRowUuid = ({ nodeDef, ancestorMultipleEntity, node }) =>
  _hasTable(nodeDef) ? Node.getUuid(node) : Node.getUuid(ancestorMultipleEntity)

export const generateRdbUpdates = ({ survey, record, nodes }) => {
  // visit nodes with BFS algorithm to avoid FK constraints violations (sort nodes by hierarchy depth)
  const nodesArray = Object.values(nodes).sort(
    (nodeA, nodeB) => Node.getHierarchy(nodeA).length - Node.getHierarchy(nodeB).length
  )
  return nodesArray.reduce((updatesAcc, node) => {
    const nodeDef = Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey)
    // skip single entities
    if (!NodeDef.isRoot(nodeDef) && NodeDef.isSingleEntity(nodeDef)) {
      return updatesAcc
    }
    const type = _getType(nodeDef, node)
    if (type) {
      const ancestorDef = Survey.getNodeDefAncestorMultipleEntity(nodeDef)(survey)
      const ancestorDefUuid = NodeDef.getUuid(ancestorDef)
      const ancestorMultipleEntity = _findAncestor({ ancestorDefUuid, node, nodes })
      const update = {
        type,
        schema: SchemaRdb.getName(Survey.getId(survey)),
        table: DataTable.getName(nodeDef, ancestorDef),
        valuesByColumnName: _getValuesByColumnName({ survey, record, nodeDef, node, ancestorMultipleEntity, type }),
        rowUuid: _getRowUuid({ nodeDef, ancestorMultipleEntity, node }),
      }
      updatesAcc.addUpdate(update)
    }
    return updatesAcc
  }, new RdbUpdates())
}

// ==== execution

const _update = (update, client) => {
  const { schema, table, valuesByColumnName, rowUuid } = update
  const columnNames = Object.keys(valuesByColumnName)
  const values = Object.values(valuesByColumnName)
  return client.one(
    `UPDATE ${schema}.${table}
      SET ${columnNames.map((col, i) => `${col} = $${i + 2}`).join(',')}
      WHERE uuid = $1
      RETURNING uuid`,
    [rowUuid, ...values]
  )
}

const _insert = (update, client) => {
  const { schema, table, valuesByColumnName } = update
  const columnNames = Object.keys(valuesByColumnName)
  const values = Object.values(valuesByColumnName)
  return client.one(
    `INSERT INTO ${schema}.${table}
      (${columnNames.join(',')})
      VALUES 
      (${columnNames.map((_col, i) => `$${i + 1}`).join(',')})
      RETURNING uuid`,
    values
  )
}

const _delete = (update, client) => {
  const { schema, table, rowUuid } = update
  return client.oneOrNone(
    `DELETE FROM ${schema}.${table} 
    WHERE uuid = $1
    RETURNING uuid`,
    rowUuid
  )
}

const queryByType = {
  [types.delete]: _delete,
  [types.insert]: _insert,
  [types.update]: _update,
}

export const updateTablesFromUpdates = async ({ rdbUpdates }, client) => {
  const updatesToRunInBatch = [...rdbUpdates.getAll().map((update) => queryByType[update.type](update, client))]

  if (updatesToRunInBatch.length > 0) {
    await client.batch(updatesToRunInBatch)
  }
}

export const updateTables = async ({ survey, record, nodes }, client) => {
  const rdbUpdates = generateRdbUpdates({ survey, record, nodes })
  await updateTablesFromUpdates({ rdbUpdates }, client)
}

export const updateRecordStep = async ({ surveyId, recordUuid, stepId, tableDef }, client) => {
  const tableName = DataTable.getName(tableDef)

  return client.one(
    `UPDATE ${SchemaRdb.getName(surveyId)}.${tableName}
    SET ${DataTable.columnNameRecordStep} = $/stepId/
    WHERE ${DataTable.columnNameRecordUuid} = $/recordUuid/
    RETURNING uuid`,
    { recordUuid, stepId }
  )
}
