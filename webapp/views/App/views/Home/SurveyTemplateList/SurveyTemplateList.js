import React from 'react'

import { Surveys } from '@webapp/components/Surveys'

const SurveyTemplateList = () => (
  <Surveys module="templates" moduleApiUri="/api/surveys" title="appModules.surveyListTemplates" />
)

export default SurveyTemplateList
