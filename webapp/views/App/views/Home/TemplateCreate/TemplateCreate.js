import React from 'react'

import { SurveyCreate } from '@webapp/components/survey/SurveyCreate'

const TemplateCreate = () => (
  <SurveyCreate showImport={false} submitButtonLabel="surveyCreate:createTemplate" template />
)

export default TemplateCreate
