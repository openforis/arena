import './Dashboard.scss'

import React from 'react'

import * as Survey from '@core/survey/survey'

import { useShouldShowFirstTimeHelp } from '@webapp/components/hooks'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { useSurveyInfo } from '@webapp/store/survey'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { Tabs } from '@webapp/components/Tabs'

import Helper, { helperTypes } from './Helper'
import SamplingDataChart from './SamplingPointDataSummary/SamplingDataChart'
import RecordsSummaryPeriodSelector from './RecordsSummary/RecordsSummaryPeriodSelector'
import { StorageSummary } from './StorageSummary'
import SurveyInfo from './SurveyInfo'
import { useFetchMessages } from './ActivityLog/store/actions/useGetActivityLogMessages'
import { useRecordsSummary } from './RecordsSummary/store'
import { useHasSamplingPointData } from './hooks/useHasSamplingPointData'
import { RecordsSummaryContext } from './RecordsSummaryContext'
import RecordsByUser from './UserSummary/RecordsByUser'
import DailyRecordsByUser from './UserSummary/DailyRecordsByUser'
import TotalRecordsSummaryChart from './RecordsSummary/Chart'

const Dashboard = () => {
  const showFirstTimeHelp = useShouldShowFirstTimeHelp({ useFetchMessages, helperTypes })
  const canEditSurvey = useAuthCanEditSurvey()
  const surveyInfo = useSurveyInfo()
  const isSurveyInfoEmpty = Object.keys(surveyInfo).length === 0
  const recordsSummaryState = useRecordsSummary()
  const hasSamplingPointData = useHasSamplingPointData()

  const tabItems = []

  const hasRecords =
    canEditSurvey && !isSurveyInfoEmpty && !Survey.isTemplate(surveyInfo) && recordsSummaryState.counts.length > 0

  if (hasRecords) {
    tabItems.push(
      {
        key: 'recordsByUser',
        label: 'recordsByUser',
        content: <RecordsByUser className="records-by-user" />,
      },
      {
        key: 'dailyRecordsByUser',
        label: 'dailyRecordsByUser',
        content: <DailyRecordsByUser />,
      },
      {
        key: 'totalRecords',
        label: 'totalRecords',
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
    label: 'storageSummary',
    content: <StorageSummary />,
  })
  if (hasSamplingPointData) {
    tabItems.push({
      key: 'samplingDataSummary',
      label: 'samplingDataSummary',
      content: <SamplingDataChart />,
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
            {hasRecords && <RecordsSummaryPeriodSelector />}
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
