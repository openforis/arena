import './Dashboard.scss'

import React from 'react'

import * as Survey from '@core/survey/survey'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { useSurveyInfo } from '@webapp/store/survey'

import SurveyInfo from './SurveyInfo'
import ActivityLog from './ActivityLog'
import RecordsSummary from './RecordsSummary'

const Dashboard = () => {
  const canEditDef = useAuthCanEditSurvey()
  const surveyInfo = useSurveyInfo()

  return (
    <SurveyDefsLoader draft={canEditDef} validate={canEditDef}>
      <div className="home-dashboard">
        <SurveyInfo />

        {!Survey.isTemplate(surveyInfo) && <RecordsSummary />}
      </div>
      <ActivityLog />
    </SurveyDefsLoader>
  )
}

export default Dashboard
