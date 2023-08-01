import * as Survey from '@core/survey/survey'
import * as Record from '@core/record/record'
import * as Node from '@core/record/node'
import * as DateUtils from '@core/dateUtils'
import * as PromiseUtils from '@core/promiseUtils'

import * as ArenaSurveyFileZip from '@server/modules/arenaImport/service/arenaImport/model/arenaSurveyFileZip'
import DataImportBaseJob from '@server/modules/dataImport/service/DataImportJob/DataImportBaseJob'
import * as RecordManager from '@server/modules/record/manager/recordManager'

import FileZip from '@server/utils/file/fileZip'
import { ArenaMobileDataImport } from '../../arenaMobileDataImport'
import { RecordNodesUpdater } from '@core/record/_record/recordNodesUpdater'

export default class RecordsImportJob extends DataImportBaseJob {
  constructor(params) {
    super(RecordsImportJob.type, params)
  }

  async execute() {
    const { filePath } = this.context

    const arenaSurveyFileZip = new FileZip(filePath)
    await arenaSurveyFileZip.init()

    const recordSummaries = await ArenaSurveyFileZip.getRecords(arenaSurveyFileZip)
    this.total = recordSummaries.length

    if (this.total == 0) return

    // import records sequentially
    await PromiseUtils.each(recordSummaries, async (recordSummary) => {
      const recordUuid = Record.getUuid(recordSummary)

      const record = await ArenaSurveyFileZip.getRecord(arenaSurveyFileZip, recordUuid)

      await this.insertOrSkipRecord({ record })

      this.incrementProcessedItems()
    })
  }

  async insertOrSkipRecord({ record }) {
    const { survey, conflictResolutionStrategy } = this.context

    const surveyId = Survey.getId(survey)

    const recordUuid = Record.getUuid(record)

    const recordSummary = this.prepareRecordSummaryToStore(record)

    const existingRecordSummary = await RecordManager.fetchRecordSummary({ surveyId, recordUuid }, this.tx)

    if (existingRecordSummary) {
      if (conflictResolutionStrategy === ArenaMobileDataImport.conflictResolutionStrategies.skipDuplicates) {
        // skip record
        this.logDebug(`skipping record ${recordUuid}; it already exists`)
      } else if (
        conflictResolutionStrategy === ArenaMobileDataImport.conflictResolutionStrategies.overwriteIfUpdated &&
        DateUtils.isAfter(Record.getDateModified(recordSummary), Record.getDateModified(existingRecordSummary))
      ) {
        this.logDebug(`updating record ${recordUuid}`)

        const recordTarget = await RecordManager.fetchRecordAndNodesByUuid({
          surveyId,
          recordUuid,
          draft: false,
          fetchForUpdate: true,
        })
        RecordNodesUpdater.mergeRecords({ survey, recordSource: record, recordTarget })
      }
      return
    } else {
      // insert record
      await RecordManager.insertRecord(this.user, surveyId, recordSummary, true, this.tx)

      // insert nodes (add them to batch persister)
      const nodes = Record.getNodesArray(record).sort((nodeA, nodeB) => nodeA.id - nodeB.id)

      // check that the node definition associated to the node has not been deleted from the survey
      const validNodes = nodes.filter((node) => !!Survey.getNodeDefByUuid(Node.getNodeDefUuid(node))(survey))

      await this.persistUpdatedNodes({ nodesUpdated: validNodes })
    }
  }

  /**
   * Updates the record modified date using the max modified date of the nodes.
   *
   * @param {!object} record - The record object.
   * @returns {object} - The modified record.
   */
  prepareRecordSummaryToStore(record) {
    const nodes = Record.getNodesArray(record)
    const maxNodeModifiedDate = new Date(Math.max.apply(null, nodes.map(Node.getDateModified)))
    return Record.assocDateModified(maxNodeModifiedDate)(record)
  }
}

RecordsImportJob.type = 'RecordsImportJob'
