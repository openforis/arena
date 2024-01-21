import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'
import * as Record from '@core/record/record'

import DataImportJob from '@server/modules/dataImport/service/DataImportJob'
import { DataImportFileReader } from '@server/modules/dataImport/service/DataImportJob/dataImportFileReader'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as SurveyRdbManager from '@server/modules/surveyRdb/manager/surveyRdbManager'
import FileZip from '@server/utils/file/fileZip'

import * as AnalysisManager from '../../manager'
import { RecordsProvider } from './RecordsProvider'

export default class PersistResultsJob extends DataImportJob {
  async onStart() {
    const { surveyId, tx } = this
    const { chainUuid, cycle, nodeDefUuid, filePath } = this.context
    await super.onStart()

    // survey is fetched after onStart is called
    const { survey } = this.context

    this.recordsProvider = new RecordsProvider({ surveyId, tx })

    this.fileZip = new FileZip(filePath)
    await this.fileZip.init()

    const entityDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
    const zipEntryName = `${NodeDef.getName(entityDef)}.csv`
    this.stream = await this.fileZip.getEntryStream(zipEntryName)

    const chain = await AnalysisManager.fetchChain({ surveyId, chainUuid }, tx)
    await SurveyRdbManager.deleteNodeResultsByChainUuid({ survey, entity: entityDef, chain, cycle, chainUuid }, tx)
  }

  async fetchSurvey() {
    const { surveyId, tx } = this
    const { cycle } = this.context

    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId(
      {
        surveyId,
        cycle,
        advanced: true,
        draft: true,
        includeAnalysis: true,
      },
      tx
    )
    this.setContext({ survey })
  }

  async createCsvReader() {
    const { cycle, nodeDefUuid, survey } = this.context

    return DataImportFileReader.createReaderFromStream({
      stream: this.stream,
      survey,
      cycle,
      nodeDefUuid,
      onRowItem: this.onRowItem.bind(this),
      // onTotalChange: (total) => (this.total = total),
      includeAnalysis: true,
      validateHeaders: false,
    })
  }

  async onRowItem(item) {
    const { survey } = this.context
    const { errors, row, valuesByDefUuid } = item
    const { record_uuid: recordUuid, parent_uuid: entityUuid } = row
    const record = await this.recordsProvider.getOrFetch(recordUuid)
    const entity = Record.getNodeByUuid(entityUuid)(record)
    const updateResultUpdateAttributes = await Record.updateAttributesInEntityWithValues({
      survey,
      entity,
      valuesByDefUuid,
      sideEffect: true,
    })(record)

    this.currentRecord = updateResultUpdateAttributes.record
    this.recordsProvider.add(this.currentRecord)

    // await massiveUpdateData.push(row)
    // await massiveUpdateNodes.push(row)
  }

  async onEnd() {
    await super.onEnd()
    this.fileZip?.close()
  }
}
