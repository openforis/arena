import './Dashboard.scss'

import React from 'react'

import * as Survey from '@core/survey/survey'

import { useShouldShowFirstTimeHelp } from '@webapp/components/hooks'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyInfo } from '@webapp/store/survey'
import { TestId } from '@webapp/utils/testId'

import Helper, { helperTypes } from './Helper'
import SurveyInfo from './SurveyInfo'
import { useFetchMessages } from './ActivityLog/store/actions/useGetActivityLogMessages'
import RecordsSummaryPeriodSelector from './RecordsSummaryPeriodSelector'
import { useRecordsSummary } from './RecordsSummaryPeriodSelector/store'
import { RecordsSummaryContext } from './RecordsSummaryContext'
import RecordsSummaryCard from './RecordsSummaryCard'
import ContributorsCard from './ContributorsCard'

/**
 * Single-page dashboard: survey info, period filter and KPI cards.
 *
 * @returns {React.ReactElement} The dashboard.
 */
const Dashboard = () => {
  const showFirstTimeHelp = useShouldShowFirstTimeHelp({ useFetchMessages, helperTypes })
  const canEditSurvey = useAuthCanEditSurvey()
  const surveyInfo = useSurveyInfo()
  const recordsSummaryState = useRecordsSummary()

  const canHaveRecords = Survey.canHaveRecords(surveyInfo)

  return (
    <SurveyDefsLoader draft={canEditSurvey} validate={canEditSurvey}>
      {showFirstTimeHelp ? (
        <Helper firstTimeHelp={showFirstTimeHelp} />
      ) : (
        <div className="home-dashboard">
          <RecordsSummaryContext.Provider value={recordsSummaryState}>
            {Survey.isValid(surveyInfo) && <SurveyInfo />}
            {canHaveRecords && (
              <>
                <RecordsSummaryPeriodSelector testId={TestId.dashboard.periodSelector} />
                <div className="home-dashboard__kpi-row">
                  <RecordsSummaryCard />
                  <ContributorsCard />
                </div>
              </>
            )}
          </RecordsSummaryContext.Provider>
        </div>
      )}
    </SurveyDefsLoader>
  )
}

export default Dashboard
