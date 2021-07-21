import './Dashboard.scss'

import React from 'react'

import * as Survey from '@core/survey/survey'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { useSurveyInfo } from '@webapp/store/survey'

import SurveyInfo from './SurveyInfo'
import ActivityLog from './ActivityLog'
import RecordsSummary from './RecordsSummary'
import Helper, { helperTypes } from './Helper'

import { useFetchMessages } from './ActivityLog/store/actions/useGetActivityLogMessages'
import { useShouldShowFirstTimeHelp } from '@webapp/components/hooks'

const Dashboard = () => {
  const showFirstTimeHelp = useShouldShowFirstTimeHelp({ useFetchMessages, helperTypes })

  const canEditDef = useAuthCanEditSurvey()
  const surveyInfo = useSurveyInfo()

  return (
    <SurveyDefsLoader draft={canEditDef} validate={canEditDef}>
      {showFirstTimeHelp && canEditDef ? (
        <Helper firstTimeHelp={showFirstTimeHelp} />
      ) : (
        <>
          <div className="home-dashboard">
            <SurveyInfo />

            {!Survey.isTemplate(surveyInfo) && <RecordsSummary />}
          </div>
          <ActivityLog />
        </>
      )}
    </SurveyDefsLoader>
  )
}

export default Dashboard
