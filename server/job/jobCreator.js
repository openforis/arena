const R = require('ramda')

const CategoryImportJob = require('@server/modules/category/service/categoryImportJob')
const CollectImportJob = require('@server/modules/collectImport/service/collectImport/collectImportJob')
const SurveyPublishJob = require('@server/modules/survey/service/publish/surveyPublishJob')
const TaxonomyImportJob = require('@server/modules/taxonomy/service/taxonomyImportJob')

const jobClasses = [
  CategoryImportJob,
  CollectImportJob,
  SurveyPublishJob,
  TaxonomyImportJob,
]

const getJobClass = jobType => R.find(R.propEq('type', jobType), jobClasses)

const createJob = (jobType, params) => {
  const JobClass = getJobClass(jobType)

  return new JobClass(params)
}

module.exports = {
  createJob,
}