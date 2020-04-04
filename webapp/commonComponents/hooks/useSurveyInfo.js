import { useSelector } from 'react-redux'

import * as SurveyState from '@webapp/survey/surveyState'

export default () => useSelector(SurveyState.getSurveyInfo)
