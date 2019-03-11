const R = require('ramda')

const SurveyPublishJob = require('../modules/survey/publish/surveyPublishJob')
const CollectSurveyImportJob = require('../modules/survey/collectImport/collectSurveyImportJob')
const TaxonomyImportJob = require('../modules/taxonomy/service/taxonomyImportJob')

const jobClasses = [
  SurveyPublishJob,
  CollectSurveyImportJob,
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