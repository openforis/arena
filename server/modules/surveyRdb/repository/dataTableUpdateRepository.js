import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as SchemaRdb from '@common/surveyRdb/schemaRdb'

import * as DataTable from '../schemaRdb/dataTable'
import * as DataCol from '../schemaRdb/dataCol'
import { RdbUpdateTypes, RdbUpdates } from './RdbUpdates'
import MassiveUpdate from '@server/db/massiveUpdate'
import { Objects } from '@openforis/arena-core'

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

const _getColumnNames = ({ nodeDef, type }) =>
  type === types.insert
    ? [
        DataTable.columnNameUuid,
        ...(NodeDef.isRoot(nodeDef)
          ? [
              DataTable.columnNameRecordUuid,
              DataTable.columnNameRecordCycle,
              DataTable.columnNameRecordStep,
              DataTable.columnNameRecordOwnerUuid,
            ]
          : []),
        DataTable.columnNameParentUuid,
        ...(NodeDef.isMultipleAttribute(nodeDef) // Entity
          ? DataCol.getNames(nodeDef)
          : []),
      ]
    : DataCol.getNames(nodeDef)

const _getColValues = ({ survey, record, nodeDef, node, ancestorMultipleEntity, type }) => {
  if (type !== types.insert) {
    return DataCol.getValues(survey, nodeDef, node)
  }
  const colValues = [Node.getUuid(node)]
  if (NodeDef.isRoot(nodeDef)) {
    colValues.push(
      ...[Node.getRecordUuid(node), Record.getCycle(record), Record.getStep(record), Record.getOwnerUuid(record)]
    )
  }
  colValues.push(Node.getUuid(ancestorMultipleEntity))
  if (NodeDef.isMultipleAttribute(nodeDef)) {
    colValues.push(...DataCol.getValues(survey, nodeDef, node))
  }
  return colValues
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
        columnNames: _getColumnNames({ nodeDef, type }),
        columnValues: _getColValues({ survey, record, nodeDef, node, ancestorMultipleEntity, type }),
        rowUuid: _getRowUuid({ nodeDef, ancestorMultipleEntity, node }),
      }
      updatesAcc.addUpdate(update)
    }
    return updatesAcc
  }, new RdbUpdates())
}

// ==== execution

const _update = (update, client) =>
  client.one(
    `UPDATE ${update.schema}.${update.table}
      SET ${update.columnNames.map((col, i) => `${col} = $${i + 2}`).join(',')}
      WHERE uuid = $1
      RETURNING uuid`,
    [update.rowUuid, ...update.columnValues]
  )

const _insert = (update, client) =>
  client.one(
    `INSERT INTO ${update.schema}.${update.table}
      (${update.columnNames.join(',')})
      VALUES 
      (${update.columnNames.map((_col, i) => `$${i + 1}`).join(',')})
      RETURNING uuid`,
    update.columnValues
  )

const _delete = (update, client) =>
  client.oneOrNone(
    `DELETE FROM ${update.schema}.${update.table} 
    WHERE uuid = $1
    RETURNING uuid`,
    update.rowUuid
  )

const queryByType = {
  [types.delete]: _delete,
  [types.insert]: _insert,
  [types.update]: _update,
}

export const updateTablesFromUpdates = async ({ rdbUpdates }, client) => {
  const updatesToRunInBatch = []
  for await (const key of rdbUpdates.keys) {
    const tableUpdates = rdbUpdates.getByKey(key)
    const { schema, table, type } = RdbUpdates.expandKey(key)
    const tableUpdatesItems = tableUpdates.getAll()
    if (type === types.update) {
      let prevColumnNames = null
      let massiveUpdate = null
      for await (const update of tableUpdatesItems) {
        const { columnNames, columnValues, rowUuid } = update
        if (!prevColumnNames || !Objects.isEqual(columnNames, prevColumnNames)) {
          if (massiveUpdate) {
            await massiveUpdate.flush()
          }
          const colsForUpdate = [...columnNames, `?uuid`]
          massiveUpdate = new MassiveUpdate({ schema, table, cols: colsForUpdate }, client)
        }
        massiveUpdate.push(...columnValues, rowUuid)
        prevColumnNames = columnNames
      }
      await massiveUpdate?.flush()
    } else {
      updatesToRunInBatch.push(...tableUpdatesItems.map((update) => queryByType[update.type](update, client)))
    }
  }

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
