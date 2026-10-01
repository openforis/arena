import './RecentActivitySection.scss'

import React, { useCallback, useState } from 'react'

import * as Survey from '@core/survey/survey'

import { Button, LoadingBar } from '@webapp/components'
import AiActivityLogSummaryModal from '@webapp/components/ai/AiActivityLogSummaryModal'
import { useAiFeatureEnabled } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import { useOnIntersect } from '@webapp/components/hooks'
import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { FileUtils } from '@webapp/utils/fileUtils'
import { TestId } from '@webapp/utils/testId'

import { ActivityLogMessage, useActivityLog } from '../ActivityLog/store'
import { DashboardSection } from '../components/DashboardSection'
import { RecentActivityRow } from './RecentActivityRow'

// Position from the end of the list whose row triggers loading older messages
const LOAD_MORE_OFFSET = 10

/**
 * Fetches and lists activity log messages; mounted only once the section is in view.
 *
 * @returns {React.ReactElement} The activity list, with an inline error state when the fetch fails.
 */
const RecentActivityContent = () => {
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()
  const { messages, hasError, onGetActivityLogMessagesNext } = useActivityLog()
  const [setLoadMoreTriggerElement] = useOnIntersect(onGetActivityLogMessagesNext)
  const aiSummaryEnabled = useAiFeatureEnabled('userActivity')
  const [summaryOpen, setSummaryOpen] = useState(false)

  const activityLogSize = FileUtils.toHumanReadableFileSize(Survey.getActivityLogSize(surveyInfo))
  const loadMoreTriggerIndex = messages.length - LOAD_MORE_OFFSET

  return (
    <>
      <div className="recent-activity__toolbar">
        <span>{i18n.t('homeView:dashboard.activityLog.size', { size: activityLogSize }) as string}</span>
        {aiSummaryEnabled && messages.length > 0 && (
          <Button
            className="btn-s btn-ai-summary"
            iconClassName="icon-stats-bars icon-14px"
            label="aiActivityLog.summarizeButton"
            onClick={() => setSummaryOpen(true)}
          />
        )}
      </div>
      {hasError && (
        <p className="recent-activity__error" role="alert" data-testid={TestId.dashboard.activityError}>
          {i18n.t('homeView:dashboard.activityLog.loadError') as string}
        </p>
      )}
      {!hasError && messages.length === 0 && <LoadingBar />}
      {messages.length > 0 && (
        <ul className="recent-activity__list">
          {messages.map((message, index) => (
            <RecentActivityRow
              key={ActivityLogMessage.getId(message)}
              message={message}
              setRef={index === loadMoreTriggerIndex ? setLoadMoreTriggerElement : undefined}
            />
          ))}
        </ul>
      )}
      {summaryOpen && <AiActivityLogSummaryModal onClose={() => setSummaryOpen(false)} />}
    </>
  )
}

/**
 * Dashboard section listing the latest survey activity; fetching starts when the section scrolls into view.
 *
 * @returns {React.ReactElement} The section.
 */
const RecentActivitySection = () => {
  const [visible, setVisible] = useState(false)
  const onSectionVisible = useCallback(() => setVisible(true), [])
  const [setSectionRef] = useOnIntersect(onSectionVisible)

  return (
    <DashboardSection titleKey="homeView:dashboard.activityLog.title" testId={TestId.dashboard.activitySection}>
      <div ref={setSectionRef} className="recent-activity">
        {visible && <RecentActivityContent />}
      </div>
    </DashboardSection>
  )
}

export default RecentActivitySection
