import * as DateUtils from '@core/dateUtils'
import { FileFormats } from '@core/fileFormats'

import Job from '@server/job/job'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'
import * as FileUtils from '@server/utils/file/fileUtils'
import * as SurveyManager from '../manager/surveyManager'

export default class SurveysListExportJob extends Job {
  constructor(params) {
    super(SurveysListExportJob.type, params)
  }

  async execute() {
    const { user, draft, template, fileFormat = FileFormats.xlsx } = this.context

    const items = await SurveyManager.fetchUserSurveysInfo({
      user,
      draft,
      template,
      includeCounts: true,
      includeOwnerEmailAddress: true,
      onProgress: ({ total, processed }) => {
        this.total = total
        this.processed = processed
      },
      stopIfFunction: () => this.isCanceled(),
    })

    this.total = items.length

    const fields = [
      'id',
      'uuid',
      'name',
      'label',
      'status',
      'dateCreated',
      'dateModified',
      'datePublished',
      'cycles',
      'languages',
      'ownerName',
      'ownerEmail',
      'nodeDefsCount',
      'recordsCount',
      'chainsCount',
      'filesCount',
      'filesSize',
      'filesMissing',
    ]

    const objectTransformer = (surveySummary) =>
      Object.entries(surveySummary).reduce((acc, [key, value]) => {
        const valueTransformed = key.startsWith('date')
          ? DateUtils.convertDate({
              dateStr: value,
              formatFrom: DateUtils.formats.datetimeISO,
              formatTo: DateUtils.formats.datetimeExport,
            })
          : value
        acc[key] = valueTransformed
        return acc
      }, {})

    const outputTempFileName = FileUtils.newTempFileName()
    const outputFilePath = FileUtils.tempFilePath(outputTempFileName)
    const outputStream = FileUtils.createWriteStream(outputFilePath)

    await FlatDataWriter.writeItemsToStream({
      outputStream,
      items,
      fields,
      options: { objectTransformer, removeNewLines: false },
      fileFormat,
    })

    this.setContext({ outputTempFileName })
  }

  async beforeSuccess() {
    const { outputTempFileName } = this.context
    this.setResult({ outputTempFileName })
  }
}

SurveysListExportJob.type = 'SurveysListExportJob'
