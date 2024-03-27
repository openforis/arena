import './Notification.scss'

import React from 'react'
import { useDispatch } from 'react-redux'
import { CSSTransition } from 'react-transition-group'

import { useI18n } from '@webapp/store/system'
import { NotificationActions, useNotification } from '@webapp/store/ui'

const Notification = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const { messageParams, messageKey, severity, visible } = useNotification()

  return (
    <CSSTransition in={visible} timeout={250} unmountOnExit>
      <div className={`notification ${severity}`}>
        <button
          type="button"
          className="btn-s btn-transparent notification__btn-close"
          onClick={() => dispatch(NotificationActions.hideNotification())}
        >
          <span className="icon icon-cross icon-8px" />
        </button>

        <div className="notification-content">{i18n.t(messageKey, messageParams)}</div>
      </div>
    </CSSTransition>
  )
}

export default Notification
