import { templateCloned } from '../mock/survey'
import { createTemplate } from './_templateCreate'
import { exportSurvey, verifyCategories, verifyNodeDefs, verifySurvey, verifyTaxonomies } from './_surveyExport'

export default () =>
  describe('Template Create from Survey', () => {
    createTemplate(templateCloned)

    exportSurvey(templateCloned)

    verifySurvey(templateCloned)

    verifyNodeDefs(templateCloned)

    verifyCategories(templateCloned)

    verifyTaxonomies(templateCloned)
  })
