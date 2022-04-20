import React from 'react'

import { Surveys } from '@webapp/components/survey/Surveys'

const TemplateList = () => <Surveys module="templates" moduleApiUri="/api/surveys" template />

export default TemplateList
