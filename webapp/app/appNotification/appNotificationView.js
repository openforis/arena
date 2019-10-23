import './appNotification.scss'

import React from 'react'
import { connect } from 'react-redux'

import { CSSTransition } from 'react-transition-group'

import * as AppState from '../appState'

import * as NotificationState from './appNotificationState'

import { hideNotification } from './actions'

const AppNotificationView = props => {
  const {
    visible, messageKey, messageParams, severity,
    i18n,
    hideNotification,
  } = props

  return (
    <CSSTransition
      in={visible}
      timeout={250}
      unmountOnExit>

      <div className={`app-notification ${severity}`}>
        <button className="btn-s btn-transparent app-notification__btn-close"
                onClick={hideNotification}>
          <span className="icon icon-cross icon-8px"/>
        </button>

        <div>
          {i18n.t(messageKey, messageParams)}
        </div>

      </div>

    </CSSTransition>
  )

}

const mapStateToProps = state => ({
  messageKey: NotificationState.getMessageKey(state),
  messageParams: NotificationState.getMessageParams(state),
  severity: NotificationState.getSeverity(state),
  visible: NotificationState.isVisible(state),
  i18n: AppState.getI18n(state),
})

export default connect(mapStateToProps, { hideNotification })(AppNotificationView)