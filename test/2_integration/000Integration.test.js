import { SurveyIntegration } from './001surveyIntegrationtest'
import { NodeDefExpressions } from './002nodeDefExpressionsValidationtest'
import { RecordUpdateManager } from './003recordUpdatertest'
import { Applicable } from './004applicableUpdatetest'
import { CalculatedValue } from './005calculatedValueUpdatetest'
import { ActivityLogTest } from './006activityLogtest'
import { SurveyRDB } from './007surveyRdbSynctest'
import { RecordValidationTest } from './008recordValidationtest'
import { ProcessingchainTest } from './009analysistest'
import { TaxonomyTest } from './010taxonomytest'

describe('Integation Test', () => {
  SurveyIntegration()
  NodeDefExpressions()
  RecordUpdateManager()
  Applicable()
  CalculatedValue()

  ActivityLogTest()
  SurveyRDB()
  RecordValidationTest()
  ProcessingchainTest()
  TaxonomyTest()
})
