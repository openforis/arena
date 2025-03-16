import * as Record from '@core/record/record'
import * as Node from '@core/record/node'

import * as RecordManager from '@server/modules/record/manager/recordManager'
import DataImportBaseJob from './DataImportBaseJob'

export default class EntitiesDeleteJob extends DataImportBaseJob {
  constructor(params) {
    super('EntitiesDeleteJob', params)
    this.entitiesDeleted = 0
  }

  async execute() {
    const { context, tx } = this
    const { recordsSummary, surveyId } = context

    if (!recordsSummary) return

    this.total = recordsSummary.length

    for await (const recordSummary of recordsSummary) {
      const recordUuid = Record.getUuid(recordSummary)
      const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid }, tx)
      this.currentRecord = record
      await this.deleteNotUpdatedEntities()
      this.incrementProcessedItems()
    }
  }

  async deleteNotUpdatedEntities() {
    const { context, currentRecord } = this
    const { entityUuidTouchedByRecordUuid, includeFiles, nodeDefUuid, survey, user } = context

    const recordUuid = Record.getUuid(currentRecord)
    const sideEffect = !includeFiles
    const nodes = Record.getNodesByDefUuid(nodeDefUuid)(currentRecord)
    const nodeUuidsToDelete = nodes.filter((node) => !entityUuidTouchedByRecordUuid[recordUuid]?.[Node.getUuid(node)])
    if (nodeUuidsToDelete.length === 0) return null

    const updateResult = await Record.deleteNodes({
      user,
      survey,
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
