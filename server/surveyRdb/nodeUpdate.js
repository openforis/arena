const R = require('ramda')
const Promise = require('bluebird')

const Survey = require('../../common/survey/survey')
const SurveyUtils = require('../../common/survey/surveyUtils')
const NodeDef = require('../../common/survey/nodeDef')
const Node = require('../../common/record/node')

const DataTable = require('./dataTable')
const DataCol = require('./dataCol')

const types = {insert: 'insert', update: 'update', delete: 'delete'}

const toUpdates = async (nodes, nodeDefs) => {

  const updates = await Promise.all(
    R.values(nodes).map(async node => {

      const nodeDef = nodeDefs[Node.getNodeDefUuid(node)]
      const nodeDefParent = nodeDefs[NodeDef.getNodeDefParentUuid(nodeDef)]
      const nodeParent = nodes[Node.getParentUuid(node)]

      const isMultiple = NodeDef.isNodeDefMultiple(nodeDef)
      const isEntity = NodeDef.isNodeDefEntity(nodeDef)
      const isRoot = NodeDef.isNodeDefRoot(nodeDef)
      const hasTable = isEntity || isMultiple

      const type = node.created && hasTable
        ? types.insert
        : node.updated || node.created
          ? types.update
          : node.deleted && hasTable
            ? types.delete
            : node.deleted
              ? types.update
              : null

      return type ? {
        type,
        tableName: isEntity
          ? DataTable.getTableName(nodeDef)
          : isMultiple
            ? DataTable.getTableName(nodeDefParent, nodeDef)
            : DataTable.getTableName(nodeDefParent),

        colNames: type === types.insert
          ? [DataTable.colNameUuuid, isRoot ? DataTable.colNameRecordUuuid : DataTable.colNameParentUuuid]
          : DataCol.getNames(nodeDef),

        colValues: type === types.insert
          ? [SurveyUtils.getUuid(node), isRoot ? Node.getRecordUuid(node) : Node.getParentUuid(node)]
          : await DataCol.getValues(Survey.getSurveyInfo(survey), nodeDef, node),

        rowUuid: hasTable
          ? node.uuid
          : nodeParent.uuid
      } : null
    })
  )

  return updates
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