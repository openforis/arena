import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as RecordManager from '@server/modules/record/manager/recordManager'
import { createRecordEvaluationContext } from '@server/modules/record/manager/recordEvaluationContextDefault'
import DataImportBaseJob from './DataImportBaseJob'
import { DataImportRecordPermissions } from './dataImportRecordPermissions'

export default class EntitiesDeleteJob extends DataImportBaseJob {
  constructor(params) {
    super('EntitiesDeleteJob', params)
    this.entitiesDeleted = 0
  }

  async execute() {
    const { context, tx } = this
    const { recordsSummary, survey, surveyId, updateRecordsInAnalysis, user, userQualifierFilters } = context

    if (!recordsSummary) return

    this.total = recordsSummary.length

    for (const recordSummary of recordsSummary) {
      const recordUuid = Record.getUuid(recordSummary)
      const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid }, tx) // NOSONAR
      // records the user cannot edit are left untouched
      if (
        DataImportRecordPermissions.canUpdateRecord({
          user,
          survey,
          record,
          updateRecordsInAnalysis,
          userQualifierFilters,
        })
      ) {
        this.currentRecord = record
        await this.deleteNotUpdatedEntities() // NOSONAR
      }
      this.incrementProcessedItems()
    }
  }

  async deleteNotUpdatedEntities() {
    const { context, currentRecord } = this
    const { entityUuidTouchedByRecordUuid, includeFiles, nodeDefUuid, survey, user } = context

    const recordUuid = Record.getUuid(currentRecord)
    const sideEffect = !includeFiles
    const nodes = Record.getNodesByDefUuid(nodeDefUuid)(currentRecord)
    const nodeUuidsToDelete = []
    for (const node of nodes) {
      const nodeUuid = Node.getUuid(node)
      if (!entityUuidTouchedByRecordUuid[recordUuid]?.[nodeUuid]) {
        nodeUuidsToDelete.push(nodeUuid)
      }
    }
    if (nodeUuidsToDelete.length === 0) return null

    const updateResult = await Record.deleteNodes({
      ...createRecordEvaluationContext({ user, survey }),
      record: currentRecord,
      nodeUuids: nodeUuidsToDelete,
      sideEffect,
    })
    this.entitiesDeleted += nodeUuidsToDelete.length

    const { nodes: nodesUpdated } = updateResult

    await this.persistUpdatedNodes({ nodesUpdated })
  }

  generateResult() {
    const result = super.generateResult()
    const { entitiesDeleted } = this
    return { ...result, entitiesDeleted }
  }
}
