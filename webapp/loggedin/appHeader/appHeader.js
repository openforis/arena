import './appHeader.scss'

import React, { useState, useRef } from 'react'
import { connect } from 'react-redux'

import { usePrevious } from '../../commonComponents/hooks'
import ProfilePicture from '../../commonComponents/profilePicture'

import UserPopupMenu from './components/userPopupMenu'

import User from '../../../common/user/user'
import Survey from '../../../common/survey/survey'

import * as AppState from '../../app/appState'
import * as SurveyState from '../../survey/surveyState'

const AppHeader = props => {
  const { user, surveyInfo, lang } = props
  const [showUserPopup, setShowUserPopup] = useState(false)
  const prevUser = usePrevious(user)
  const pictureUpdateKeyRef = useRef(0)

  pictureUpdateKeyRef.current += !!(prevUser !== user)

  return (
    <div className="app-header">

      <div className="app-header__logo">
        <img src="/img/of-logo-small.png"/>
      </div>

      <div className="app-header__survey">
        {Survey.getLabel(surveyInfo, lang)}
      </div>

      <div className="app-header__user"
           onClick={() => {
             setShowUserPopup(showUserPopupPrev => !showUserPopupPrev)
           }}>

        <ProfilePicture userUuid={User.getUuid(user)} forceUpdateKey={pictureUpdateKeyRef.current}/>

        <button className="btn btn-transparent">
          <span className="icon icon-ctrl"/>
        </button>
      </div>

      {
        showUserPopup &&
        <UserPopupMenu
          onClose={() => setShowUserPopup(false)}/>
      }

    </div>
  )

}

const mapStateToProps = state => ({
  user: AppState.getUser(state),
  lang: AppState.getLang(state),
  surveyInfo: SurveyState.getSurveyInfo(state),
})

export default connect(mapStateToProps)(AppHeader)