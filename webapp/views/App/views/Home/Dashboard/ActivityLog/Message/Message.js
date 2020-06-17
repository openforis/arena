import React from 'react'
import PropTypes from 'prop-types'

import * as DateUtils from '@core/dateUtils'

import { useI18n } from '@webapp/store/system'
import ProfilePicture from '@webapp/components/profilePicture'

import Markdown from '@webapp/components/markdown'

import * as ActivityLogMessage from '../store/ActivityLogMessage'

const getMessageClassName = ({ message }) => `activity-log__message 
${ActivityLogMessage.isItemDeleted(message) ? 'item-deleted' : ''}
${ActivityLogMessage.isHighlighted(message) ? 'highlighted' : ''}
`

const Message = ({ message }) => {
  const i18n = useI18n()
  const className = getMessageClassName({ message })

  return (
    <React.Fragment key={ActivityLogMessage.getId(message)}>
      <div className={className}>
        <div className="activity">
          <ProfilePicture userUuid={ActivityLogMessage.getUserUuid(message)} thumbnail />
          <Markdown source={`${ActivityLogMessage.getUserName(message)} ${ActivityLogMessage.getMessage(message)}`} />
        </div>
        <div className="date">{DateUtils.getRelativeDate(i18n, ActivityLogMessage.getDateCreated(message))}</div>
      </div>
      <div className="activity-log__message-separator" />
    </React.Fragment>
  )
}

Message.propTypes = {
  message: PropTypes.object.isRequired,
}

export default Message
