import './appHeader.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'

import ProfilePicture from '../../commonComponents/profilePicture'

import UserPopupMenu from './components/userPopupMenu'

import Survey from '../../../common/survey/survey'

import * as AppState from '../../app/appState'
import * as SurveyState from '../../survey/surveyState'

const AppHeader = props => {
  const { surveyInfo, lang } = props
  const [showUserPopup, setShowUserPopup] = useState(false)

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

        <ProfilePicture/>

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
  lang: AppState.getLang(state),
  surveyInfo: SurveyState.getSurveyInfo(state),
})

export default connect(mapStateToProps)(AppHeader)