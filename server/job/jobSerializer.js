const R = require('ramda')

const SurveyPublishJob = require('../survey/publish/surveyPublishJob')
const NodeDefsValidationJob = require('../survey/publish/nodeDefsValidationJob')
const CodeListsValidationJob = require('../survey/publish/codeListsValidationJob')
const SurveyInfoValidationJob = require('../survey/publish/surveyInfoValidationJob')
const SurveyPropsPublishJob = require('../survey/publish/surveyPropsPublishJob')
const TaxonomiesValidationJob = require('../survey/publish/taxonomiesValidationJob')

const TaxonomyImportJob = require('../taxonomy/taxonomyImportJob')

const jobClasses = [
  SurveyPublishJob,
  NodeDefsValidationJob,
  CodeListsValidationJob,
  SurveyInfoValidationJob,
  SurveyPropsPublishJob,
  TaxonomiesValidationJob,
  TaxonomyImportJob,
]

const getJobClass = jobType => R.find(R.propEq('type', jobType), jobClasses)

const createJob = (jobDb, params, parentId = null) => {
  // first create instance of inner jobs
  const innerJobs = jobDb.innerJobs ?
    jobDb.innerJobs.map(
      innerJob => createJob(innerJob, params, jobDb.id)
    )
    : []

  const jobClass = getJobClass(jobDb.type)

  // create instance
  return new jobClass(
    {...params, id: jobDb.id, parentId},
    innerJobs
  )
}

const deserializeJob = (jobDb, params) => createJob(jobDb, {...params, masterJobId: jobDb.id})

module.exports = {
  deserializeJob
}