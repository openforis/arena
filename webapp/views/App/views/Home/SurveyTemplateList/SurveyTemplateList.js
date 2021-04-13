import React from 'react'

import { Surveys } from '@webapp/components/survey/Surveys'

const SurveyTemplateList = () => (
  <Surveys module="surveyTemplates" moduleApiUri="/api/surveys" template title="appModules.surveyListTemplates" />
)

export default SurveyTemplateList
