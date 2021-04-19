import { templateFromSurvey } from '../mock/survey'
import { selectSurvey } from './_surveyList'
import { gotoTemplateList } from './_navigation'
import { publishWithoutErrors, verifySurveyPublished } from './_publish'

export default () =>
  describe('Template Publish', () => {
    gotoTemplateList()

    selectSurvey(templateFromSurvey, templateFromSurvey.label)

    publishWithoutErrors({ inHomePage: true })

    verifySurveyPublished()
  })
