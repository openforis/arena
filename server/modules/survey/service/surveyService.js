import * as DateUtils from '@core/dateUtils'

import { RecordsUpdateThreadService } from '@server/modules/record/service/update/surveyRecordsThreadService'
import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'
import * as FlatDataWriter from '@server/utils/file/flatDataWriter'

import * as SurveyManager from '../manager/surveyManager'
import SurveyCloneJob from './clone/surveyCloneJob'
import SurveyExportJob from './surveyExport/surveyExportJob'
import SurveyPublishJob from './publish/surveyPublishJob'
import SurveyUnpublishJob from './unpublish/surveyUnpublishJob'
import { SchemaSummary } from './schemaSummary'
import SurveyLabelsImportJob from './surveyLabelsImportJob'
import { SurveyLabelsExport } from './surveyLabelsExport'

// JOBS
export const startPublishJob = (user, surveyId) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  const job = new SurveyPublishJob({ user, surveyId })

  JobManager.enqueueJob(job)

  return job
}

export const startUnpublishJob = (user, surveyId) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  const job = new SurveyUnpublishJob({ user, surveyId })

  JobManager.enqueueJob(job)

  return job
}

export const exportSurvey = ({ surveyId, user, includeData = false, includeActivityLog = true }) => {
  const outputFileName = `survey_export_${surveyId}_${Date.now()}.zip`
  const job = new SurveyExportJob({ surveyId, user, outputFileName, backup: includeData, includeActivityLog })

  JobManager.enqueueJob(job)

  return { job: JobUtils.jobToJSON(job), outputFileName }
}

export const exportSurveysList = async ({ user, draft, template, outputStream }) => {
  const items = await fetchUserSurveysInfo({
    user,
    draft,
    template,
    includeCounts: true,
    includeOwnerEmailAddress: true,
  })
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

  await FlatDataWriter.writeItemsToStream({
    outputStream,
    items,
    fields,
    options: { objectTransformer, removeNewLines: false },
  })
}

export const cloneSurvey = ({ user, surveyId, surveyInfoTarget, cycle = null }) => {
  const job = new SurveyCloneJob({ user, surveyId, surveyInfoTarget, cycle })
  JobManager.enqueueJob(job)
  return JobUtils.jobToJSON(job)
}

export const exportSchemaSummary = async ({ surveyId, cycle, outputStream, fileFormat }) =>
  SchemaSummary.exportSchemaSummary({ surveyId, cycle, outputStream, fileFormat })

export const exportLabels = async ({ surveyId, outputStream, fileFormat }) =>
  SurveyLabelsExport.exportLabels({ surveyId, outputStream, fileFormat })

export const deleteSurvey = async (surveyId) => {
  RecordsUpdateThreadService.clearSurveyDataFromThread({ surveyId })

  await SurveyManager.deleteSurvey(surveyId)
}

export const startLabelsImportJob = ({ user, surveyId, filePath, fileFormat }) => {
  const job = new SurveyLabelsImportJob({ user, surveyId, filePath, fileFormat })
  return JobManager.enqueueJob(job)
}

export const {
  // CREATE
  insertSurvey,
  // READ
  fetchUserSurveysInfo,
  countOwnedSurveys,
  countUserSurveys,
  fetchSurveyById,
  fetchSurveyAndNodeDefsBySurveyId,
  fetchSurveyAndNodeDefsAndRefDataBySurveyId,
  // UPDATE
  updateSurveyDependencyGraphs,
  updateSurveyProps,
  updateSurveyConfigurationProp,
  updateSurveyOwner,
  // DELETE
  deleteTemporarySurveys,
  // UTILS
  validateNewSurvey,
  validateSurveyClone,
  validateSurveyImportFromCollect,
} = SurveyManager
