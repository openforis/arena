import './Dashboard.scss'

import React from 'react'

import * as Survey from '@core/survey/survey'

import { useAuthCanEditSurvey } from '@webapp/store/user'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { useSurveyInfo } from '@webapp/store/survey'

import SurveyInfo from './SurveyInfo'
import ActivityLog from './ActivityLog'
import RecordsSummary from './RecordsSummary'
import { StorageSummary } from './StorageSummary'
import Helper, { helperTypes } from './Helper'

import { useFetchMessages } from './ActivityLog/store/actions/useGetActivityLogMessages'
import { useShouldShowFirstTimeHelp } from '@webapp/components/hooks'

// Import mockup charts
import MockupChart0 from './MockupChart0'
import MockupChart1 from './MockupChart1'
import MockupChart2 from './MockupChart2'
import MockupChart3 from './MockupChart3'

const Dashboard = () => {
  const showFirstTimeHelp = useShouldShowFirstTimeHelp({ useFetchMessages, helperTypes })

  const canEditSurvey = useAuthCanEditSurvey()
  const surveyInfo = useSurveyInfo()

  return (
    <SurveyDefsLoader draft={canEditSurvey} validate={canEditSurvey}>
      {showFirstTimeHelp && canEditSurvey ? (
        <Helper firstTimeHelp={showFirstTimeHelp} />
      ) : (
        <>
          <div className="home-dashboard">
            <SurveyInfo />

            {!Survey.isTemplate(surveyInfo) && (
              <div>
                <RecordsSummary />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3em', width: '90%' }}>
                  {/* {canEditSurvey && <StorageSummary />} */}
                  <MockupChart0 />
                  <MockupChart1 />
                  <MockupChart2 />
                </div>
                <MockupChart3 />
              </div>
            )}
          </div>
          <ActivityLog />
        </>
      )}
    </SurveyDefsLoader>
  )
}

export default Dashboard
