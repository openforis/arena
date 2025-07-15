import Job from '@server/job/job'

import * as DateUtils from '@core/dateUtils'
import i18n from '@core/i18n/i18nFactory'
import * as RecordValidationReportItem from '@core/record/recordValidationReportItem'
import * as NodeDef from '@core/survey/nodeDef'
import * as ValidationResult from '@core/validation/validationResult'
import { ValidationUtils } from '@core/validation/validationUtils'

import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as SurveyManager from '@server/modules/survey/manager/surveyManager'
import * as RecordManager from '../manager/recordManager'

export default class VaidationReportGenerationJob extends Job {
  constructor(params) {
    super(VaidationReportGenerationJob.type, params)
  }

  async execute() {
    const { surveyId, cycle, fileFormat, recordUuid, lang } = this.context
    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, cycle })

    // create temp file
    const tempFileName = FileUtils.newTempFileName()
    const tempFilePath = FileUtils.tempFilePath(tempFileName, this.categoriesTempFolderName)
    const outputStream = FileUtils.createWriteStream(tempFilePath)

    const objectTransformer = (item) => {
      const nodeDef = RecordValidationReportItem.getNodeDef(survey)(item)
      const name = NodeDef.getName(nodeDef)
      const label = NodeDef.getLabel(nodeDef, lang)
      const path = RecordValidationReportItem.getPath({ survey, lang, labelType: NodeDef.NodeDefLabelTypes.name })(item)
      const pathLabels = RecordValidationReportItem.getPath({
        survey,
        lang,
        labelType: NodeDef.NodeDefLabelTypes.label,
      })(item)
      const validation = RecordValidationReportItem.getValidation(item)

      const errors = ValidationUtils.getJointMessage({
        i18n,
        survey,
        showKeys: false,
        severity: ValidationResult.severity.error,
      })(validation)

      const warnings = ValidationUtils.getJointMessage({
        i18n,
        survey,
        showKeys: false,
        severity: ValidationResult.severity.warning,
      })(validation)

      return {
        path,
        path_labels: pathLabels,
        name,
        label,
        errors,
        warnings,
        record_step: RecordValidationReportItem.getRecordStep(item),
        record_cycle: Number(RecordValidationReportItem.getRecordCycle(item)) + 1,
        record_owner_name: RecordValidationReportItem.getRecordOwnerName(item),
        record_date_created: DateUtils.formatDateTimeExport(RecordValidationReportItem.getRecordDateCreated(item)),
        record_date_modified: DateUtils.formatDateTimeExport(RecordValidationReportItem.getRecordDateModified(item)),
      }
    }
    const fields = [
      'path',
      'path_labels',
      'name',
      'label',
      'errors',
      'warnings',
      'record_step',
      'record_cycle',
      'record_owner_name',
      'record_date_created',
      'record_date_modified',
    ]

    this.total = await RecordManager.countValidationReportItems({ surveyId, cycle, recordUuid }, this.tx)

    await RecordManager.getValidationReportAsStream(
      {
        surveyId,
        cycle,
        recordUuid,
        processor: async (dbStream) => {
          this.dbStream = dbStream
          await FlatDataWriter.writeItemsStreamToStream({
            stream: dbStream,
            outputStream,
            fields,
            options: { objectTransformer },
            fileFormat,
            onData: () => {
              this.incrementProcessedItems()
            },
          })
        },
      },
      this.tx
    )

    this.setContext({ tempFileName })
  }

  generateResult() {
    const { tempFileName } = this.context
    return { tempFileName }
  }

  async cancel() {
    await super.cancel()
    this.dbStream?.destroy()
  }
}

VaidationReportGenerationJob.type = 'VaidationReportGenerationJob'
