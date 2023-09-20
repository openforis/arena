import React, { useState } from 'react'
import * as Survey from '@core/survey/survey'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyInfo } from '@webapp/store/survey'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import TabSelector from './TabSelector'
import Helper, { helperTypes } from './Helper'
import MockupChart1 from './MockupChart1'
import MockupChart2 from './MockupChart2'
import MockupChart3 from './MockupChart3'
import RecordsSummary from './RecordsSummary'
import { StorageSummary } from './StorageSummary'
import SurveyInfo from './SurveyInfo'
import { useFetchMessages } from './ActivityLog/store/actions/useGetActivityLogMessages'
import { useRecordsSummary } from './RecordsSummary/store'
import { RecordsSummaryContext } from './RecordsSummaryContext'
import { useShouldShowFirstTimeHelp } from '@webapp/components/hooks'
import './Dashboard.scss'

const Dashboard = () => {
  const showFirstTimeHelp = useShouldShowFirstTimeHelp({ useFetchMessages, helperTypes })

  const canEditSurvey = useAuthCanEditSurvey()
  const surveyInfo = useSurveyInfo()
  const [activeTab, setActiveTab] = useState('Dashboard')

  const recordsSummaryState = useRecordsSummary()

  const tabs = {
    Dashboard: 'Dashboard',
    RecordHistory: 'Record History',
  }

  return (
    <SurveyDefsLoader draft={canEditSurvey} validate={canEditSurvey}>
      {showFirstTimeHelp && canEditSurvey ? (
        <Helper firstTimeHelp={showFirstTimeHelp} />
      ) : (
        <>
          <div className="home-dashboard">
            <RecordsSummaryContext.Provider value={recordsSummaryState}>
              <SurveyInfo />
              <div className="tab-menu">
                <TabSelector tabs={tabs} currentTab={activeTab} onSelectTab={setActiveTab} />
              </div>
              {!Survey.isTemplate(surveyInfo) && <RecordsSummary />}
              {activeTab === 'Dashboard' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3em', width: '90%' }}>
                    {canEditSurvey && <StorageSummary />}
                    {canEditSurvey && <MockupChart1 />}
                    {canEditSurvey && <MockupChart2 />}
                  </div>
                  {canEditSurvey && <MockupChart3 />}
                </>
              )}
              {activeTab === 'Record History' && <StorageSummary />}
            </RecordsSummaryContext.Provider>
          </div>
        </>
      )}
    </SurveyDefsLoader>
  )
}

export default Dashboard
