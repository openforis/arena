import { Records } from '@openforis/arena-core'

import Job from '@server/job/job'
import * as RecordManager from '@server/modules/record/manager/recordManager'
import * as SurveyManager from '@server/modules/survey/manager/surveyManager'

export default class RecordsValidationJob extends Job {
  constructor(params) {
    super(RecordsValidationJob.type, params)
  }

  async onStart() {
    await super.onStart()

    const { context, tx } = this
    const { surveyId } = context

    const survey = await SurveyManager.fetchSurveyAndNodeDefsBySurveyId({ surveyId, advanced: true }, tx)
    this.setContext({ survey })
  }

  async execute() {
    const recordSummaries = await this.findRecordsToValidate()

    this.total = recordSummaries.length

    for (let index = 0; index < recordSummaries.length && !this.isCanceled(); index++) {
      const recordSummary = recordSummaries[index]
      await this.validateRecord({ recordSummary })
    }
  }

  async findRecordsToValidate() {
    const { context } = this
    const { surveyId } = context

    const { list: recordSummaries } = await RecordManager.fetchRecordsSummaryBySurveyId({ surveyId })

    return recordSummaries
  }

  async validateRecord({ recordSummary }) {
    const { context, tx, user } = this
    const { surveyId, survey } = context

    const recordUuid = recordSummary.uuid
    const record = await RecordManager.fetchRecordAndNodesByUuid({ surveyId, recordUuid })

    const nodesArray = []
    Records.visitDescendantsAndSelf({
      record,
      node: Records.getRoot(record),
      visitor: (node) => {
        nodesArray.push(node)
      },
    })
    await RecordManager.validateSortedNodesAndPersistValidation(
      {
        user,
        survey,
        record,
        nodesArray,
        validateRecordUniqueness: true,
      },
      tx
    )
    this.incrementProcessedItems()
  }
}

RecordsValidationJob.type = 'RecordsValidationJob'
