import * as R from 'ramda';
import CategoryImportJob from '../modules/category/service/categoryImportJob';
import CollectImportJob from '../modules/collectImport/service/collectImport/collectImportJob';
import SurveyPublishJob from '../modules/survey/service/publish/surveyPublishJob';
import TaxonomyImportJob from '../modules/taxonomy/service/taxonomyImportJob';

const jobClasses = [
  CategoryImportJob,
  CollectImportJob,
  SurveyPublishJob,
  TaxonomyImportJob,
]

const getJobClass = jobType => R.find(R.propEq('type', jobType), jobClasses)

export const createJob = (jobType, params) => {
  const JobClass = getJobClass(jobType)

  return new JobClass(params)
}

export default {
  createJob,
};
