import SurveyManager from '../manager/surveyManager';
import JobManager from '../../../job/jobManager';
import SurveyPublishJob from './publish/surveyPublishJob';

const startPublishJob = (user, surveyId) => {
  const job = new SurveyPublishJob({ user, surveyId })

  JobManager.executeJobThread(job)

  return job
}

export default {
  // CREATE
  createSurvey: SurveyManager.createSurvey,
  validateNewSurvey: SurveyManager.validateNewSurvey,

  // READ
  fetchUserSurveysInfo: SurveyManager.fetchUserSurveysInfo,
  countUserSurveys: SurveyManager.countUserSurveys,
  fetchSurveyById: SurveyManager.fetchSurveyById,
  fetchSurveyAndNodeDefsBySurveyId: SurveyManager.fetchSurveyAndNodeDefsBySurveyId,

  // UPDATE
  updateSurveyProps: SurveyManager.updateSurveyProps,

  // DELETE
  deleteSurvey: SurveyManager.deleteSurvey,

  // JOBS
  startPublishJob,
};
