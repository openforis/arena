import * as R from 'ramda'

import CategoryImportJob from '@server/modules/category/service/categoryImportJob'
import CollectImportJob from '@server/modules/collectImport/service/collectImport/collectImportJob'
import SurveyPublishJob from '@server/modules/survey/service/publish/surveyPublishJob'
import SurveyCloneJob from '@server/modules/survey/service/clone/surveyCloneJob'
import TaxonomyImportJob from '@server/modules/taxonomy/service/taxonomyImportJob'
import ArenaImportJob from '@server/modules/arenaImport/service/arenaImport/arenaImportJob'

const jobClasses = [
  CategoryImportJob,
  CollectImportJob,
  SurveyPublishJob,
  TaxonomyImportJob,
  ArenaImportJob,
  SurveyCloneJob,
]

const getJobClass = (jobType) => R.find(R.propEq('type', jobType), jobClasses)

export const createJob = (jobType, params) => {
  const JobClass = getJobClass(jobType)

  return new JobClass(params)
}
