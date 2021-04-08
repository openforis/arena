import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'

import * as Response from '@server/utils/response'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as TaxonomyService from '@server/modules/taxonomy/service/taxonomyService'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as RecordService from '@server/modules/record/service/recordService'
import * as AnalysisService from '@server/modules/analysis/service'
import * as FileService from '@server/modules/record/service/fileService'
import * as UserService from '@server/modules/user/service/userService'
import * as ActivityLogService from '@server/modules/activityLog/service/activityLogService'

import * as JobManager from '@server/job/jobManager'
import * as JobUtils from '@server/job/jobUtils'
import * as SurveyManager from '../manager/surveyManager'

import SurveyPublishJob from './publish/surveyPublishJob'
import SurveyCloneJob from './clone/surveyCloneJob'
import ExportCsvDataJob from './export/exportCsvDataJob'

// JOBS
export const startPublishJob = (user, surveyId) => {
  const job = new SurveyPublishJob({ user, surveyId })

  JobManager.executeJobThread(job)

  return job
}

export const exportSurvey = async ({ surveyId, res, user }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(surveyId, null, true)
  const surveyInfo = Survey.getSurveyInfo(survey)
  const surveyName = Survey.getName(surveyInfo)

  const files = []
  const prefix = `survey_${surveyName}`

  // Survey
  files.push({ data: JSON.stringify(survey, null, 2), name: FileUtils.join(prefix, `survey.json`) })

  // Categories
  const categoriesPathDir = FileUtils.join(prefix, 'categories')
  const categoriesPathFile = FileUtils.join(categoriesPathDir, 'categories.json')
  const categories = await CategoryService.fetchCategoriesAndLevelsBySurveyId({ surveyId, draft: true })
  const categoriesUuids = Object.keys(categories || {})
  files.push({ data: JSON.stringify(categories, null, 2), name: categoriesPathFile })

  await Promise.all(
    categoriesUuids.map(async (categoryUuid) => {
      const itemsData = await CategoryService.fetchItemsByCategoryUuid(surveyId, categoryUuid, true)
      files.push({
        data: JSON.stringify(itemsData, null, 2),
        name: FileUtils.join(categoriesPathDir, `${categoryUuid}.json`),
      })
    })
  )

  // Taxonomy
  const taxonomiesPathDir = FileUtils.join(prefix, 'taxonomies')
  const taxonomiesPathFile = FileUtils.join(taxonomiesPathDir, 'taxonomies.json')
  const taxonomies = await TaxonomyService.fetchTaxonomiesBySurveyId({ surveyId, draft: true })
  files.push({ data: JSON.stringify(taxonomies, null, 2), name: taxonomiesPathFile })

  await Promise.all(
    taxonomies.map(async (taxonomy) => {
      const taxaData = await TaxonomyService.fetchTaxaWithVernacularNames(surveyId, taxonomy.uuid, true)
      files.push({
        data: JSON.stringify(taxaData, null, 2),
        name: FileUtils.join(taxonomiesPathDir, `${taxonomy.uuid}.json`),
      })
    })
  )

  // Records
  const recordsPathDir = FileUtils.join(prefix, 'records')
  const recordsPathFile = FileUtils.join(recordsPathDir, 'records.json')
  const records = await RecordService.fetchRecordsUuidAndCycle(surveyId)
  files.push({ data: JSON.stringify(records, null, 2), name: recordsPathFile })

  await Promise.all(
    records.map(async (record) => {
      const recordData = await RecordService.fetchRecordAndNodesByUuid(surveyId, record.uuid, true)

      files.push({
        data: JSON.stringify(recordData, null, 2),
        name: FileUtils.join(recordsPathDir, `${record.uuid}.json`),
      })
    })
  )

  // Chain
  const chainsPathDir = FileUtils.join(prefix, 'chains')
  const chainsPathFile = FileUtils.join(chainsPathDir, 'chains.json')
  const chains = await AnalysisService.fetchChains({ surveyId })
  files.push({ data: JSON.stringify(chains, null, 2), name: chainsPathFile })

  await Promise.all(
    chains.map(async (chain) => {
      const chainData = await AnalysisService.fetchChain({
        surveyId,
        chainUuid: chain.uuid,
        includeStepsAndCalculations: true,
        includeScript: true,
      })
      files.push({
        data: JSON.stringify(chainData, null, 2),
        name: FileUtils.join(chainsPathDir, `${chain.uuid}.json`),
      })
    })
  )

  // Files
  const filesData = await FileService.fetchFilesBySurveyId(surveyId)
  const filesPathDir = FileUtils.join(prefix, 'files')
  await Promise.all(
    filesData.map(async (fileData) => {
      files.push({
        data: JSON.stringify(fileData, null, 2),
        name: FileUtils.join(filesPathDir, `${fileData.uuid}.json`),
      })
    })
  )

  // Users
  const usersPathDir = FileUtils.join(prefix, 'users')
  const usersPathFile = FileUtils.join(usersPathDir, 'users.json')
  const usersProfilePicturePathDir = FileUtils.join(usersPathDir, 'profilepictures')

  const users = await UserService.fetchUsersBySurveyId(user, surveyId)
  files.push({ data: JSON.stringify(users, null, 2), name: usersPathFile })
  await Promise.all(
    users.map(async (_user) => {
      const userData = await UserService.fetchUserByUuidWithPassword(User.getUuid(_user))
      if (User.hasProfilePicture(userData)) {
        const userProfilePicture = await UserService.fetchUserProfilePicture(User.getUuid(userData))
        files.push({
          data: userProfilePicture,
          name: FileUtils.join(usersProfilePicturePathDir, `${User.getUuid(userData)}`), // the file is stored in binary
        })
      }
    })
  )

  const userInvitationsPathFile = FileUtils.join(usersPathDir, 'userInvitations.json')
  const userInvitations = await UserService.fetchUserInvitationsBySurveyId({ survey })
  files.push({ data: JSON.stringify(userInvitations, null, 2), name: userInvitationsPathFile })

  // Activity Log
  const activityLogPathDir = FileUtils.join(prefix, 'activitylog')
  const activityLogPathFile = FileUtils.join(activityLogPathDir, 'activitylog.json')

  const activityLog = await ActivityLogService.fetch({ user, surveyId, limit: 'ALL', orderBy: 'ASC' })
  files.push({ data: JSON.stringify(activityLog, null, 2), name: activityLogPathFile })

  Response.sendFilesAsZip(res, `${prefix}.zip`, files)
}

export const cloneSurvey = ({ user, surveyInfo, surveyId }) => {
  const job = new SurveyCloneJob({ user, surveyId, surveyInfo })
  JobManager.executeJobThread(job)
  return JobUtils.jobToJSON(job)
}

export const startExportCsvDataJob = ({ surveyId, user }) => {
  const job = new ExportCsvDataJob({ user, surveyId })

  JobManager.executeJobThread(job)

  return job
}

export const {
  // CREATE
  insertSurvey,
  // READ
  fetchUserSurveysInfo,
  countUserSurveys,
  fetchSurveyById,
  fetchSurveyAndNodeDefsBySurveyId,
  // UPDATE
  updateSurveyProps,
  // DELETE
  deleteSurvey,
  // UTILS
  validateNewSurvey,
} = SurveyManager
