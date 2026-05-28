import './ActivityLog.scss'

import React, { useState } from 'react'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'

import { Button, LoadingBar } from '@webapp/components'
import { useOnIntersect } from '@webapp/components/hooks'

import { useSurveyInfo } from '@webapp/store/survey'
import { useActivityLog, ActivityLogMessage } from './store'
import Message from './Message'
import { FileUtils } from '@webapp/utils/fileUtils'
import { useI18n } from '@webapp/store/system'
import AiActivityLogSummary from '@webapp/components/ai/AiActivityLogSummary'
import { useAiFeatureEnabled } from '@webapp/components/ai/hooks/useAiFeatureEnabled'

const minSizeToDisplayMessages = 1024 * 10 // 10KB

const ActivityLog = () => {
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()

  const { messages, onGetActivityLogMessagesNext } = useActivityLog()
  const [setNextActivitiesFetchTrigger] = useOnIntersect(onGetActivityLogMessagesNext)

  const activityLogSize = Survey.getActivityLogSize(surveyInfo)
  const activityLogSizeText = FileUtils.toHumanReadableFileSize(activityLogSize)

  const [summaryOpen, setSummaryOpen] = useState(false)
  const aiAnalysisEnabled = useAiFeatureEnabled('analysis')

  return (
    <div className="activity-log__container">
      <h4 className="">
        {i18n.t('homeView:dashboard.activityLog.size', { size: activityLogSizeText })}
        {aiAnalysisEnabled && messages.length > 0 && (
          <Button
            className="btn-s btn-ai-summary"
            iconClassName="icon-stats-bars icon-14px"
            label="aiActivityLog.summarizeButton"
            onClick={() => setSummaryOpen(true)}
          />
        )}
      </h4>
      {(messages.length > 0 || activityLogSize > minSizeToDisplayMessages) && (
        <div className="activity-log__messages">
          {messages.length === 0 && <LoadingBar />}
          {messages.map((message, index) => {
            const setRef = (el) => (index === R.length(messages) - 10 ? setNextActivitiesFetchTrigger(el) : null)

            return <Message setRef={setRef} key={ActivityLogMessage.getId(message)} message={message} />
          })}
        </div>
      )}
      {summaryOpen && <AiActivityLogSummary onClose={() => setSummaryOpen(false)} />}
    </div>
  )
}

export default ActivityLog
