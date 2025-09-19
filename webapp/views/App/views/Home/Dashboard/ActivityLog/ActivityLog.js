import './ActivityLog.scss'

import React from 'react'
import * as R from 'ramda'

import * as Survey from '@core/survey/survey'

import { LoadingBar } from '@webapp/components'
import { useOnIntersect } from '@webapp/components/hooks'

import { useSurveyInfo } from '@webapp/store/survey'
import { useActivityLog, ActivityLogMessage } from './store'
import Message from './Message'
import { FileUtils } from '@webapp/utils/fileUtils'
import { useI18n } from '@webapp/store/system'

const ActivityLog = () => {
  const i18n = useI18n()
  const surveyInfo = useSurveyInfo()

  const { messages, onGetActivityLogMessagesNext } = useActivityLog()
  const [setNextActivitiesFetchTrigger] = useOnIntersect(onGetActivityLogMessagesNext)

  const activityLogSize = Survey.getActivityLogSize(surveyInfo)
  const activityLogSizeText = FileUtils.toHumanReadableFileSize(activityLogSize)

  return (
    <div className="activity-log__container">
      <h4 className="">{i18n.t('homeView.dashboard.activityLog.size', { size: activityLogSizeText })}</h4>
      <div className="activity-log__messages">
        {messages.length === 0 && <LoadingBar />}
        {messages.map((message, index) => {
          const setRef = (el) => (index === R.length(messages) - 10 ? setNextActivitiesFetchTrigger(el) : null)

          return <Message setRef={setRef} key={ActivityLogMessage.getId(message)} message={message} />
        })}
      </div>
    </div>
  )
}

export default ActivityLog
