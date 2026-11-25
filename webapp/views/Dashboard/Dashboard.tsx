import './Dashboard.scss'

import * as Survey from '@core/survey/survey'
import { useShouldShowFirstTimeHelp } from '@webapp/components/hooks'
import SurveyDefsLoader from '@webapp/components/survey/SurveyDefsLoader'
import { useSurveyInfo } from '@webapp/store/survey'
import { useSystemConfigActivityLogDisabled } from '@webapp/store/system'
import { useAuthCanEditSurvey } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'

import { useFetchMessages } from './ActivityLog/store/actions/useGetActivityLogMessages'
import ContributorsCard from './ContributorsCard'
import DashboardMapSection from './DashboardMapSection'
import Helper, { helperTypes } from './Helper'
import { useHasSamplingPointData } from './hooks/useHasSamplingPointData'
import RecentActivitySection from './RecentActivitySection'
import RecordsSummaryCard from './RecordsSummaryCard'
import { RecordsSummaryContext } from './RecordsSummaryContext'
import RecordsSummaryPeriodSelector from './RecordsSummaryPeriodSelector'
import { useRecordsSummary } from './RecordsSummaryPeriodSelector/store'
import RecordTrendSection from './RecordTrendSection'
import SamplingPointSection from './SamplingPointSection'
import StorageCard from './StorageCard'
import SurveyInfo from './SurveyInfo'

/**
 * Single-page dashboard shell: survey info, period filter, KPI cards, record trend,
 * a conditional map section when the survey has geo attributes,
 * a conditional sampling-point section when the survey has sampling keys and the user can edit,
 * and recent activity when the activity log is enabled and the user can edit.
 *
 * @returns {React.ReactElement} The dashboard.
 */
const Dashboard = () => {
  const showFirstTimeHelp = useShouldShowFirstTimeHelp({ useFetchMessages, helperTypes })
  const canEditSurvey = useAuthCanEditSurvey()
  const surveyInfo = useSurveyInfo()
  const recordsSummaryState = useRecordsSummary()
  const hasSamplingPointData = useHasSamplingPointData()
  const activityLogDisabled = useSystemConfigActivityLogDisabled()

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
                  {canEditSurvey && <StorageCard />}
                </div>
                <RecordTrendSection />
                <DashboardMapSection />
                {hasSamplingPointData && canEditSurvey && <SamplingPointSection />}
                {!activityLogDisabled && canEditSurvey && <RecentActivitySection />}
              </>
            )}
          </RecordsSummaryContext.Provider>
        </div>
      )}
    </SurveyDefsLoader>
  )
}

export default Dashboard
