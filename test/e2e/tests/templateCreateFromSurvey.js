import { templateFromSurvey } from '../mock/survey'
import { createTemplate } from './_templateCreate'
import { exportSurvey, verifyCategories, verifyNodeDefs, verifySurvey, verifyTaxonomies } from './_surveyExport'

export default () =>
  describe('Template Create from Survey', () => {
    createTemplate(templateFromSurvey)

    exportSurvey(templateFromSurvey, true)

    verifySurvey(templateFromSurvey)

    verifyNodeDefs(templateFromSurvey)

    verifyCategories(templateFromSurvey)

    verifyTaxonomies(templateFromSurvey)
  })
