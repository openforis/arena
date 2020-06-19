import './Dashboard.scss'

import React from 'react'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'

import SurveyInfo from './SurveyInfo'
import ActivityLog from './ActivityLog'
import RecordsSummary from './RecordsSummary'

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
