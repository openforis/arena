import './Notification.scss'
import { useRef } from 'react'
import { useDispatch } from 'react-redux'
import { CSSTransition } from 'react-transition-group'

import { useI18nT } from '@webapp/store/system'
import { NotificationActions, useNotification } from '@webapp/store/ui'

const Notification = () => {
  const dispatch = useDispatch()
  const t = useI18nT({ unescapeHtml: true })
  const { messageParams, messageKey, messageText, severity, visible } = useNotification()
  const nodeRef = useRef(null)

  return (
    <CSSTransition in={visible} nodeRef={nodeRef} timeout={250} unmountOnExit>
      <div ref={nodeRef} className={`notification ${severity}`}>
        <button
          type="button"
          className="btn-s btn-transparent notification__btn-close"
          onClick={() => dispatch(NotificationActions.hideNotification())}
        >
          <span className="icon icon-cross icon-8px" />
        </button>

        <div className="notification-content">{messageText ?? t(messageKey, messageParams)}</div>
      </div>
    </CSSTransition>
  )
}

export default Notification
