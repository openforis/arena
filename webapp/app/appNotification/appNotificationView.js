import './appNotification.scss'

import React from 'react'
import { connect } from 'react-redux'

import { CSSTransition } from 'react-transition-group'
import useI18n from '../../commonComponents/useI18n'

import * as AppState from '../appState'
import { hideNotification } from '../actions'

const AppNotificationView = props => {
  const {
    visible, message, messageKey,
    hideNotification,
  } = props

  return (
    <CSSTransition
      in={visible}
      timeout={250}
      unmountOnExit>

      <div className="app-notification">
        <button className="btn-s btn-transparent app-notification__btn-close"
                onClick={hideNotification}>
          <span className="icon icon-cross icon-8px"/>
        </button>

        <div>
          {
            messageKey
              ? useI18n().t(messageKey)
              : message
          }
        </div>

      </div>

    </CSSTransition>
  )

}

const mapStateToProps = state => ({
  message: AppState.getNotificationMessage(state),
  messageKey: AppState.getNotificationMessageKey(state),
  visible: AppState.isNotificationVisible(state),
})

export default connect(mapStateToProps, { hideNotification })(AppNotificationView)