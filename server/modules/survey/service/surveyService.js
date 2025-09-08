import { RecordsUpdateThreadService } from '@server/modules/record/service/update/surveyRecordsThreadService'
import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'

import * as SurveyManager from '../manager/surveyManager'
import SurveyCloneJob from './clone/surveyCloneJob'
import SurveyExportJob from './surveyExport/surveyExportJob'
import SurveyPublishJob from './publish/surveyPublishJob'
import SurveyUnpublishJob from './unpublish/surveyUnpublishJob'
import { SchemaSummary } from './schemaSummary'
import SurveyLabelsImportJob from './surveyLabelsImportJob'
import { SurveyLabelsExport } from './surveyLabelsExport'
import SurveysListExportJob from './SurveysListExportJob'

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

export const startSurveysListExport = ({ user, draft, template }) => {
  const job = new SurveysListExportJob({ user, draft, template })

  JobManager.enqueueJob(job)

  return job
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
