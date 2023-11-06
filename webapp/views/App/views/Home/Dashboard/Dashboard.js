import React, { useState } from 'react'
import * as Survey from '@core/survey/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyInfo } from '@webapp/store/survey'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import TabSelector from './TabSelector'
import Helper, { helperTypes } from './Helper'
import SamplingDataChart from './SamplingPointDataSummary/SamplingDataChart'
import RecordsSummary from './RecordsSummary'
import { StorageSummary } from './StorageSummary'
import SurveyInfo from './SurveyInfo'
import { useFetchMessages } from './ActivityLog/store/actions/useGetActivityLogMessages'
import { useRecordsSummary } from './RecordsSummary/store'
import { useHasSamplingPointData } from './hooks/useHasSamplingPointData'
import { RecordsSummaryContext } from './RecordsSummaryContext'
import { useShouldShowFirstTimeHelp } from '@webapp/components/hooks'
import './Dashboard.scss'
import RecordsByUser from './UserSummary/RecordsByUser'
import DailyRecordsByUser from './UserSummary/DailyRecordsByUser'
import Chart from './RecordsSummary/Chart'

const Dashboard = () => {
  const showFirstTimeHelp = useShouldShowFirstTimeHelp({ useFetchMessages, helperTypes })
  const canEditSurvey = useAuthCanEditSurvey()
  const surveyInfo = useSurveyInfo()
  const [activeTab, setActiveTab] = useState('Dashboard')
  const isSurveyInfoEmpty = Object.keys(surveyInfo).length === 0
  const recordsSummaryState = useRecordsSummary()
  const hasSamplingPointData = useHasSamplingPointData()

  const tabs = {
    Dashboard: 'Dashboard',
    RecordHistory: 'Record History',
  }

  return (
    <SurveyDefsLoader draft={canEditSurvey} validate={canEditSurvey}>
      {showFirstTimeHelp ? (
        <Helper firstTimeHelp={showFirstTimeHelp} />
      ) : (
        <div className="home-dashboard">
          <RecordsSummaryContext.Provider value={recordsSummaryState}>
            {!isSurveyInfoEmpty && <SurveyInfo />}
            {!isSurveyInfoEmpty && canEditSurvey && (
              <div className="tab-menu">
                <TabSelector tabs={tabs} currentTab={activeTab} onSelectTab={setActiveTab} />
              </div>
            )}
            {canEditSurvey && !isSurveyInfoEmpty && !Survey.isTemplate(surveyInfo) && <RecordsSummary />}
            {canEditSurvey && activeTab === 'Dashboard' && !isSurveyInfoEmpty && (
              <div className="chart-container-dashboard">
                <StorageSummary />
                <RecordsByUser className="records-by-user" />
                {hasSamplingPointData && <SamplingDataChart surveyInfo={surveyInfo} />}
              </div>
            )}
            {canEditSurvey && activeTab === 'Dashboard' && !isSurveyInfoEmpty && <DailyRecordsByUser />}
            {canEditSurvey && activeTab === 'RecordHistory' && !isSurveyInfoEmpty && recordsSummaryState.counts && (
              <Chart counts={recordsSummaryState.counts} from={recordsSummaryState.from} to={recordsSummaryState.to} />
            )}
          </RecordsSummaryContext.Provider>
        </div>
      )}
    </SurveyDefsLoader>
  )
}

export default Dashboard
