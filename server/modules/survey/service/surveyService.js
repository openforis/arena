import * as Response from '@server/utils/response'
import * as FileUtils from '@server/utils/file/fileUtils'

import * as TaxonomyService from '@server/modules/taxonomy/service/taxonomyService'
import * as CategoryService from '@server/modules/category/service/categoryService'
import * as RecordService from '@server/modules/record/service/recordService'
import * as AnalysisService from '@server/modules/analysis/service'

import * as JobManager from '@server/job/jobManager'
import * as SurveyManager from '../manager/surveyManager'

import SurveyPublishJob from './publish/surveyPublishJob'

// JOBS
export const startPublishJob = (user, surveyId) => {
  const job = new SurveyPublishJob({ user, surveyId })

  JobManager.executeJobThread(job)

  return job
}

export const exportSurvey = async ({ surveyId, res }) => {
  const survey = await SurveyManager.fetchSurveyAndNodeDefsAndRefDataBySurveyId(surveyId)

  const files = []
  const prefix = `survey_${surveyId}`

  // Survey
  files.push({ data: JSON.stringify(survey, null, 2), name: FileUtils.join(prefix, `survey.json`) })

  // Categories
  const categoriesPathDir = FileUtils.join(prefix, 'categories')
  const categoriesPathFile = FileUtils.join(categoriesPathDir, 'categories.json')
  const categories = await CategoryService.fetchCategoriesAndLevelsBySurveyId({ surveyId })
  const categoriesUuids = Object.keys(categories || {})
  files.push({ data: JSON.stringify(categories, null, 2), name: categoriesPathFile })

  await Promise.all(
    categoriesUuids.map(async (categoryUuid) => {
      const itemsData = await CategoryService.fetchItemsByCategoryUuid(surveyId, categoryUuid)
      files.push({
        data: JSON.stringify(itemsData, null, 2),
        name: FileUtils.join(categoriesPathDir, `${categoryUuid}.json`),
      })
    })
  )

  // Taxonomy
  const taxonomiesPathDir = FileUtils.join(prefix, 'taxonomies')
  const taxonomiesPathFile = FileUtils.join(taxonomiesPathDir, 'taxonomies.json')
  const taxonomies = await TaxonomyService.fetchTaxonomiesBySurveyId({ surveyId })
  files.push({ data: JSON.stringify(taxonomies, null, 2), name: taxonomiesPathFile })

  await Promise.all(
    taxonomies.map(async (taxonomy) => {
      const taxaData = await TaxonomyService.fetchTaxaWithVernacularNames(surveyId, taxonomy.uuid)
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
      const recordData = await RecordService.fetchRecordByUuid(surveyId, record.uuid)
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
      const chainData = await AnalysisService.fetchChain({ surveyId, chainUuid: chain.uuid })
      files.push({
        data: JSON.stringify(chainData, null, 2),
        name: FileUtils.join(chainsPathDir, `${chain.uuid}.json`),
      })
    })
  )

  Response.sendFilesAsZip(res, `${prefix}.zip`, files)
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
