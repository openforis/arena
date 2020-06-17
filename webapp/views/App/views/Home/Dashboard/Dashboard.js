import './Dashboard.scss'

import React from 'react'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import SurveyDefsLoader from '@webapp/loggedin/surveyViews/surveyDefsLoader/surveyDefsLoader'

import RecordsSummary from '@webapp/loggedin/modules/home/dashboard/recordsSummary/recordsSummary'

import SurveyInfo from './SurveyInfo'
import ActivityLog from './ActivityLog'

const Dashboard = () => {
  const canEditDef = useAuthCanEditSurvey()

  return (
    <SurveyDefsLoader draft={canEditDef} validate={canEditDef}>
      <div className="home-dashboard">
        <SurveyInfo />

        <RecordsSummary />

        <ActivityLog />
      </div>
    </SurveyDefsLoader>
  )
}

export default Dashboard
