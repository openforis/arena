import './dashboardView.scss'

import React from 'react'

import { useAuthCanEditSurvey } from '@webapp/components/hooks'
import SurveyDefsLoader from '@webapp/loggedin/surveyViews/surveyDefsLoader/surveyDefsLoader'
import SurveyInfo from './surveyInfo/surveyInfo'
import RecordsSummary from './recordsSummary/recordsSummary'
import ActivityLogView from './activityLog/activityLogView'

const DashboardView = () => {
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

export default DashboardView
