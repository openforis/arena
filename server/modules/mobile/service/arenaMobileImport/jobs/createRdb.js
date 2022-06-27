import Job from '@server/job/job'

import SurveyPropsPublishJob from '@server/modules/survey/service/publish/jobs/surveyPropsPublishJob'
import SurveyDependencyGraphsGenerationJob from '@server/modules/survey/service/surveyDependencyGraphsGenerationJob'
import SurveyRdbCreationJob from '@server/modules/surveyRdb/service/surveyRdbCreationJob'

/**
 * Creates the view when survey Imported is published.
 */
export default class CreateRdbJob extends Job {
  constructor(params) {
    super('CreateRdbJob', params, [
      new SurveyPropsPublishJob(),
      new SurveyDependencyGraphsGenerationJob(),
      new SurveyRdbCreationJob(),
    ])
  }

  async shouldExecute() {
    return true
  }
}
