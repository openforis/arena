const R = require('ramda')

const CategoryImportJob = require('../modules/category/service/categoryImportJob')
const CollectImportJob = require('../modules/collectImport/service/collectImport/collectImportJob')
const SurveyPublishJob = require('../modules/survey/service/publish/surveyPublishJob')
const TaxonomyImportJob = require('../modules/taxonomy/service/taxonomyImportJob')

const jobClasses = [
  CategoryImportJob,
  CollectImportJob,
  SurveyPublishJob,
  TaxonomyImportJob,
]

const getJobClass = jobType => R.find(R.propEq('type', jobType), jobClasses)

const createJob = (jobType, params) => {
  const jobClass = getJobClass(jobType)

  return new jobClass(params)
}

module.exports = {
  createJob,
}