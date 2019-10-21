import Job from '../../../../job/job';
import NodeDefsValidationJob from './jobs/nodeDefsValidationJob';
import CategoriesValidationJob from './jobs/categoriesValidationJob';
import TaxonomiesValidationJob from './jobs/taxonomiesValidationJob';
import SurveyInfoValidationJob from './jobs/surveyInfoValidationJob';
import RecordCheckJob from '../recordCheckJob';
import SurveyPropsPublishJob from './jobs/surveyPropsPublishJob';
import CyclesDeletedCheckJob from './jobs/cyclesDeletedCheckJob';
import SurveyDependencyGraphsGenerationJob from '../surveyDependencyGraphsGenerationJob';
import SurveyRdbGeneratorJob from '../../../surveyRdb/service/surveyRdbGeneratorJob';
import RecordsUniquenessValidationJob from '../../../record/service/recordsUniquenessValidationJob';

class SurveyPublishJob extends Job {
  static type: string = 'SurveyPublishJob'

  constructor (params) {
    super(SurveyPublishJob.type, params, [
      new NodeDefsValidationJob(),
      new CategoriesValidationJob(),
      new TaxonomiesValidationJob(),
      new SurveyInfoValidationJob(),
      new CyclesDeletedCheckJob(),
      // record check must be executed before publishing survey props
      new RecordCheckJob(),
      new SurveyPropsPublishJob(),
      new SurveyDependencyGraphsGenerationJob(),
      new SurveyRdbGeneratorJob(),
      new RecordsUniquenessValidationJob(),
    ])
  }
}

export default SurveyPublishJob;
