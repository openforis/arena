import './Dashboard.scss'

import React from 'react'

import * as Survey from '@core/survey/survey'

import { useShouldShowFirstTimeHelp } from '@webapp/components/hooks'
import { useAuthCanEditSurvey, useUserIsSystemAdmin } from '@webapp/store/user'
import { useSurveyInfo } from '@webapp/store/survey'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { Tabs } from '@webapp/components/Tabs'

import Helper, { helperTypes } from './Helper'
import SamplingDataChart from './SamplingPointDataSummary/SamplingDataChart'
import { StorageSummary } from './StorageSummary'
import SurveyInfo from './SurveyInfo'
import { useFetchMessages } from './ActivityLog/store/actions/useGetActivityLogMessages'
import { useRecordsSummary } from './RecordsSummary/store'
import { useHasSamplingPointData } from './hooks/useHasSamplingPointData'
import { RecordsSummaryContext } from './RecordsSummaryContext'
import RecordsByUser from './UserSummary/RecordsByUser'
import DailyRecordsByUser from './UserSummary/DailyRecordsByUser'
import TotalRecordsSummaryChart from './RecordsSummary/Chart'
import { ActiveUsers } from './ActiveUsers'

const Dashboard = () => {
  const showFirstTimeHelp = useShouldShowFirstTimeHelp({ useFetchMessages, helperTypes })
  const canEditSurvey = useAuthCanEditSurvey()
  const surveyInfo = useSurveyInfo()
  const isSurveyInfoEmpty = Object.keys(surveyInfo).length === 0
  const recordsSummaryState = useRecordsSummary()
  const hasSamplingPointData = useHasSamplingPointData()
  const isSystemAdmnin = useUserIsSystemAdmin()

  const tabItems = []

  const hasRecords =
    canEditSurvey && !isSurveyInfoEmpty && !Survey.isTemplate(surveyInfo) && recordsSummaryState.counts.length > 0

  if (hasRecords) {
    tabItems.push(
      {
        key: 'recordsByUser',
        label: 'homeView.dashboard.recordsByUser',
        content: <RecordsByUser />,
      },
      {
        key: 'dailyRecordsByUser',
        label: 'homeView.dashboard.dailyRecordsByUser',
        content: <DailyRecordsByUser />,
      },
      {
        key: 'totalRecords',
        label: 'homeView.dashboard.totalRecords',
        content: (
          <TotalRecordsSummaryChart
            counts={recordsSummaryState.counts}
            from={recordsSummaryState.from}
            to={recordsSummaryState.to}
          />
        ),
      }
    )
  }
  tabItems.push({
    key: 'storageSummary',
    label: 'homeView.dashboard.storageSummary.title',
    content: <StorageSummary />,
  })
  if (hasSamplingPointData) {
    tabItems.push({
      key: 'samplingPointDataCompletion',
      label: 'homeView.dashboard.samplingPointDataCompletion',
      content: <SamplingDataChart />,
    })
  }
  if (isSystemAdmnin) {
    tabItems.push({
      key: 'activeUsers',
      label: 'homeView.dashboard.activeUsers',
      content: <ActiveUsers />,
    })
  }

  return (
    <SurveyDefsLoader draft={canEditSurvey} validate={canEditSurvey}>
      {showFirstTimeHelp ? (
        <Helper firstTimeHelp={showFirstTimeHelp} />
      ) : (
        <div className="home-dashboard">
          <RecordsSummaryContext.Provider value={recordsSummaryState}>
            {!isSurveyInfoEmpty && <SurveyInfo />}
            <Tabs items={tabItems} orientation="vertical" />
            {/* {canEditSurvey && !isSurveyInfoEmpty && !Survey.isTemplate(surveyInfo) && <RecordsSummary />}
            {canEditSurvey && activeTab === 'Dashboard' && !isSurveyInfoEmpty && (
              <div className="chart-container-dashboard">
                {recordsSummaryState.counts.length > 0 && <RecordsByUser className="records-by-user" />}
                <StorageSummary />
                {hasSamplingPointData && <SamplingDataChart surveyInfo={surveyInfo} />}
              </div>
            )}
            {canEditSurvey &&
              activeTab === 'Dashboard' &&
              !isSurveyInfoEmpty &&
              recordsSummaryState.counts.length > 0 && <DailyRecordsByUser />}
            {canEditSurvey && activeTab === 'RecordHistory' && !isSurveyInfoEmpty && recordsSummaryState.counts && (
              <Chart counts={recordsSummaryState.counts} from={recordsSummaryState.from} to={recordsSummaryState.to} />
            )} */}
          </RecordsSummaryContext.Provider>
        </div>
      )}
    </SurveyDefsLoader>
  )
}

export default Dashboard
