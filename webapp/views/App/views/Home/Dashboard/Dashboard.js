import './Dashboard.scss'

import React from 'react'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import SurveyDefsLoader from '@webapp/loggedin/surveyViews/surveyDefsLoader/surveyDefsLoader'

import RecordsSummary from '@webapp/loggedin/modules/home/dashboard/recordsSummary/recordsSummary'
import ActivityLogView from '@webapp/loggedin/modules/home/dashboard/activityLog/activityLogView'

import SurveyInfo from './SurveyInfo'

const Dashboard = () => {
  const canEditDef = useAuthCanEditSurvey()

  return (
    <SurveyDefsLoader draft={canEditDef} validate={canEditDef}>
      <div className="home-dashboard">
        <SurveyInfo />

        <RecordsSummary />

        <ActivityLogView />
      </div>
    </SurveyDefsLoader>
  )
}

export default Dashboard
