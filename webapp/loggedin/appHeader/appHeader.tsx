import './appHeader.scss'

import React, { useState, useRef } from 'react'
import { connect } from 'react-redux'

import { usePrevious } from '../../commonComponents/hooks'
import ProfilePicture from '../../commonComponents/profilePicture'
import ProgressBar from '../../commonComponents/progressBar'
import UserPopupMenu from './components/userPopupMenu'
import CycleSelector from './components/cycleSelector'

import User from '../../../core/user/user'
import Survey from '../../../core/survey/survey'

import * as AppState from '../../app/appState'
import * as SurveyState from '../../survey/surveyState'

import { updateUserPrefs } from '../../app/actions'

const AppHeader = props => {
  const {
    appSaving, user, lang,
    surveyInfo, surveyCycleKey,
    updateUserPrefs
  } = props
  const [showUserPopup, setShowUserPopup] = useState(false)
  const prevUser = usePrevious(user)
  const pictureUpdateKeyRef = useRef(0)

  pictureUpdateKeyRef.current += (prevUser !== user ? 1: 0)

  return (
    <div className="app-header">

      <div className="app-header__logo">
        <img src="/img/of-logo-small.png"/>
      </div>

      <div className="app-header__survey">
        {
          Survey.isValid(surveyInfo) && (
            appSaving
              ? (
                <ProgressBar className="running progress-bar-striped" progress={100} showText={false}/>
              )
              : (
                <>
                  <div>{Survey.getLabel(surveyInfo, lang)}</div>
                  <CycleSelector
                    surveyInfo={surveyInfo}
                    surveyCycleKey={surveyCycleKey}
                    onChange={cycle => {
                      const surveyId = Survey.getIdSurveyInfo(surveyInfo)
                      const userUpdated = User.assocPrefSurveyCycle(surveyId, cycle)(user)
                      updateUserPrefs(userUpdated)
                    }}
                  />
                </>
              )
          )
        }
      </div>

      <div className="app-header__user"
           onClick={() => {
             setShowUserPopup(showUserPopupPrev => !showUserPopupPrev)
           }}>

        <ProfilePicture
          userUuid={User.getUuid(user)}
          forceUpdateKey={pictureUpdateKeyRef.current}
          thumbnail={true}
        />

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
  appSaving: AppState.isSaving(state),
  surveyInfo: SurveyState.getSurveyInfo(state),
  surveyCycleKey: SurveyState.getSurveyCycleKey(state),
})

export default connect(mapStateToProps, { updateUserPrefs })(AppHeader)
