import * as ActivityLog from '@common/activityLog/activityLog'

import * as Node from '@core/record/node'

import * as ActivityLogRepository from '@server/modules/activityLog/repository/activityLogRepository'
import * as NodeRepository from '../../repository/nodeRepository'

export const insertNodesInBulk = async ({ user, surveyId, nodesArray, systemActivity = false }, tx) => {
  const nodeValues = nodesArray.map((node) => [
    Node.getUuid(node),
    Node.getDateCreated(node),
    Node.getDateCreated(node),
    Node.getRecordUuid(node),
    Node.getParentUuid(node),
    Node.getNodeDefUuid(node),
    JSON.stringify(Node.getValue(node, null)),
    Node.getMeta(node),
  ])

  await NodeRepository.insertNodesFromValues(surveyId, nodeValues, tx)

  const activities = nodesArray.map((node) =>
    ActivityLog.newActivity(ActivityLog.type.nodeCreate, node, systemActivity)
  )
  await ActivityLogRepository.insertMany(user, surveyId, activities, tx)
}

export const insertNodesInBatch = async ({ user, surveyId, nodes, systemActivity = false }, tx) => {
  await NodeRepository.insertNodesInBatch({ surveyId, nodes }, tx)
  const activities = nodes.map((node) => ActivityLog.newActivity(ActivityLog.type.nodeCreate, node, systemActivity))
  await ActivityLogRepository.insertMany(user, surveyId, activities, tx)
}
