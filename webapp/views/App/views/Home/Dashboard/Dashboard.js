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

const Dashboard = () => {
  const showFirstTimeHelp = useShouldShowFirstTimeHelp({ useFetchMessages, helperTypes })

  const canEditSurvey = useAuthCanEditSurvey()
  const surveyInfo = useSurveyInfo()
  const [activeTab, setActiveTab] = useState('Dashboard')

  const recordsSummaryState = useRecordsSummary()
  const hasSamplingPointData = useHasSamplingPointData()

  const tabs = {
    Dashboard: 'Dashboard',
    RecordHistory: 'Record History',
  }

  return (
    <SurveyDefsLoader draft={canEditSurvey} validate={canEditSurvey}>
      {showFirstTimeHelp && canEditSurvey ? (
        <Helper firstTimeHelp={showFirstTimeHelp} />
      ) : (
        <div className="home-dashboard">
          <RecordsSummaryContext.Provider value={recordsSummaryState}>
            <SurveyInfo />
            <div className="tab-menu">
              <TabSelector tabs={tabs} currentTab={activeTab} onSelectTab={setActiveTab} />
            </div>
            {!Survey.isTemplate(surveyInfo) && <RecordsSummary />}
            {activeTab === 'Dashboard' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3em', width: '90%' }}>
                {canEditSurvey && <StorageSummary />}
                {canEditSurvey && <RecordsByUser />}
                {canEditSurvey && hasSamplingPointData && <SamplingDataChart surveyInfo={surveyInfo} />}
              </div>
            )}
            {activeTab === 'Dashboard' && canEditSurvey && <DailyRecordsByUser />}
            {activeTab === 'Record History' && <StorageSummary />}
          </RecordsSummaryContext.Provider>
        </div>
      )}
    </SurveyDefsLoader>
  )
}

export default Dashboard
