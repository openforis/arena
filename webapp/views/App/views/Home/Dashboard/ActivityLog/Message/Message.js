import React from 'react'
import PropTypes from 'prop-types'

import * as DateUtils from '@core/dateUtils'

import Markdown from '@webapp/components/markdown'
import ProfilePicture from '@webapp/components/profilePicture'
import { useI18n } from '@webapp/store/system'

import { ActivityLogMessage } from '../store'

const getMessageClassName = ({ message }) => `activity-log__message 
${ActivityLogMessage.isItemDeleted(message) ? 'item-deleted' : ''}
${ActivityLogMessage.isHighlighted(message) ? 'highlighted' : ''}
`

const Message = ({ message, setRef }) => {
  const i18n = useI18n()
  const className = getMessageClassName({ message })

  return (
    <div ref={setRef} className={className}>
      <div className="activity">
        <ProfilePicture userUuid={ActivityLogMessage.getUserUuid(message)} thumbnail />
        <Markdown source={`${ActivityLogMessage.getUserName(message)} ${ActivityLogMessage.getMessage(message)}`} />
      </div>
      <div className="date">{DateUtils.getRelativeDate(i18n, ActivityLogMessage.getDateCreated(message))}</div>
    </div>
  )
}

Message.propTypes = {
  message: PropTypes.object.isRequired,
  setRef: PropTypes.func.isRequired,
}

export default Message
