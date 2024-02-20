import './Dashboard.scss'

import React from 'react'

import * as Survey from '@core/survey/survey'

import { useShouldShowFirstTimeHelp } from '@webapp/components/hooks'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyInfo } from '@webapp/store/survey'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { Tabs } from '@webapp/components/Tabs'

import Helper, { helperTypes } from './Helper'
import SamplingPointDataSummary from './SamplingPointDataSummary'
import { StorageSummary } from './StorageSummary'
import SurveyInfo from './SurveyInfo'
import { useFetchMessages } from './ActivityLog/store/actions/useGetActivityLogMessages'
import { useRecordsSummary } from './RecordsSummaryPeriodSelector/store'
import { useHasSamplingPointData } from './hooks/useHasSamplingPointData'
import { RecordsSummaryContext } from './RecordsSummaryContext'
import RecordsByUser from './UserSummary/RecordsByUser'
import DailyRecordsByUser from './UserSummary/DailyRecordsByUser'
import TotalRecordsSummaryChart from './TotalRecordsSummaryChart'

const Dashboard = () => {
  const showFirstTimeHelp = useShouldShowFirstTimeHelp({ useFetchMessages, helperTypes })
  const canEditSurvey = useAuthCanEditSurvey()
  const surveyInfo = useSurveyInfo()
  const isSurveyInfoEmpty = Object.keys(surveyInfo).length === 0
  const recordsSummaryState = useRecordsSummary()
  const hasSamplingPointData = useHasSamplingPointData()

  const tabItems = []

  const hasRecords = !isSurveyInfoEmpty && !Survey.isTemplate(surveyInfo) && recordsSummaryState.counts.length > 0

  if (hasRecords) {
    if (canEditSurvey) {
      tabItems.push(
        {
          key: 'recordsByUser',
          label: 'homeView.dashboard.recordsByUser',
          renderContent: () => <RecordsByUser />,
        },
        {
          key: 'totalRecords',
          label: 'homeView.dashboard.totalRecords',
          renderContent: () => (
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
      key: 'dailyRecordsByUser',
      label: 'homeView.dashboard.dailyRecordsByUser',
      renderContent: () => <DailyRecordsByUser />,
    })
  }
  if (canEditSurvey) {
    tabItems.push({
      key: 'storageSummary',
      label: 'homeView.dashboard.storageSummary.title',
      renderContent: () => <StorageSummary />,
    })
    if (hasSamplingPointData) {
      tabItems.push({
        key: 'samplingPointDataCompletion',
        label: 'homeView.dashboard.samplingPointDataCompletion.title',
        renderContent: () => <SamplingPointDataSummary />,
      })
    }
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
          </RecordsSummaryContext.Provider>
        </div>
      )}
    </SurveyDefsLoader>
  )
}

export default Dashboard
