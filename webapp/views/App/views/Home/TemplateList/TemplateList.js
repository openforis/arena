import React from 'react'

import { Surveys } from '@webapp/components/survey/Surveys'

const TemplateList = () => (
  <Surveys module="surveyTemplates" moduleApiUri="/api/surveys" template title="appModules.templateList" />
)

export default TemplateList
