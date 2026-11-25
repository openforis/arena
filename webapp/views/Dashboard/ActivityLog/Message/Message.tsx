import * as DateUtils from '@core/dateUtils'

import { useI18n } from '@webapp/store/system'
import ProfilePicture from '@webapp/components/ProfilePicture'

import Markdown from '@webapp/components/Markdown'

import { ActivityLogMessage } from '../store'

const getMessageClassName = ({ message }) => `activity-log__message 
${ActivityLogMessage.isItemDeleted(message) ? 'item-deleted' : ''}
${ActivityLogMessage.isHighlighted(message) ? 'highlighted' : ''}
`

type MessageProps = {
  message: Record<string, any>
  setRef: (...args: any[]) => any
}

const Message = ({ message, setRef }: MessageProps) => {
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

export default Message
