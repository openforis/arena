import React from 'react'

import * as DateUtils from '@core/dateUtils'

import Markdown from '@webapp/components/markdown'
import { useI18n } from '@webapp/store/system'

import { ActivityLogMessage } from '../ActivityLog/store'

type RecentActivityRowProps = {
  message: Record<string, unknown>
  setRef?: (element: HTMLElement | null) => void
}

const buildRowClassName = (message: Record<string, unknown>): string => {
  const classNames = ['recent-activity__row']
  if (ActivityLogMessage.isItemDeleted(message)) classNames.push('recent-activity__row--deleted')
  if (ActivityLogMessage.isHighlighted(message)) classNames.push('recent-activity__row--highlighted')
  return classNames.join(' ')
}

/**
 * Compact activity log row: timestamp, user and message.
 *
 * @param {RecentActivityRowProps} props - The component props.
 * @returns {React.ReactElement} The row.
 */
export const RecentActivityRow = (props: RecentActivityRowProps) => {
  const { message, setRef } = props
  const i18n = useI18n()

  return (
    <li ref={setRef} className={buildRowClassName(message)}>
      <span className="recent-activity__date">
        {DateUtils.getRelativeDate(i18n, ActivityLogMessage.getDateCreated(message))}
      </span>
      <span className="recent-activity__user">{ActivityLogMessage.getUserName(message)}</span>
      <span className="recent-activity__message">
        <Markdown source={ActivityLogMessage.getMessage(message)} />
      </span>
    </li>
  )
}
