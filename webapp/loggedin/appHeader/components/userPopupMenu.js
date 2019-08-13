import './userPopupMenu.scss'

import React, { useEffect, useRef } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import useI18n from '../../../commonComponents/useI18n'

import User from '../../../../common/user/user'
import * as AppState from '../../../app/appState'

import { logout } from '../../../app/actions'

import { appModuleUri, homeModules, userModules } from '../../appModules'
import { clickedOutside } from '../../../utils/domUtils'

const UserPopupMenu = props => {
  const { user, logout, onClose } = props

  const i18n = useI18n()
  const elementRef = useRef(null)

  useEffect(() => {
    const onClickListener = e => {
      if (clickedOutside(elementRef.current, e)) {
        onClose()
      }
    }
    window.addEventListener('click', onClickListener)

    return () => {
      window.removeEventListener('click', onClickListener)
    }
  }, [])

  return (
    <div className="user-popup-menu"
         ref={elementRef}
         onMouseLeave={onClose}>

      <div className="user-popup-menu__user">
        <img src="https://cdn0.iconfinder.com/data/icons/user-pictures/100/unknown2-512.png"/>
        <div className="user-details">
          <div>
            {User.getName(user)}
          </div>
          <div>
            <Link
              className="btn-s btn-transparent"
              to={appModuleUri(userModules.userInvite)} //TODO link to user page
              onClick={onClose}>
              <span className="icon icon-user icon-12px icon-left"/>
              {i18n.t('header.myProfile')}
            </Link>
          </div>
        </div>
      </div>

      <div className="user-popup-menu__sep"/>

      <Link to={appModuleUri(homeModules.surveyList)}
            onClick={onClose}
            className="btn-s btn-transparent">
        <span className="icon icon-paragraph-justify icon-12px icon-left"/>
        {i18n.t('appModules.surveyList')}
      </Link>

      <Link to={appModuleUri(homeModules.surveyNew)}
            className="btn-s btn-transparent"
            onClick={onClose}>
        <span className="icon icon-plus icon-12px icon-left"/>
        {i18n.t('homeView.createSurvey')}
      </Link>

      <div className="user-popup-menu__sep"/>

      <a className="btn-s btn-transparent"
         onClick={() => {
           onClose()
           logout()
         }}>
        <span className="icon icon-exit icon-12px icon-left"/>
        {i18n.t('sidebar.logout')}
      </a>

    </div>
  )
}

const mapStateToProps = state => ({
  user: AppState.getUser(state)
})

export default connect(mapStateToProps, { logout })(UserPopupMenu)