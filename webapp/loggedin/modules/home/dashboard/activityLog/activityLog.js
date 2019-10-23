import './activityLog.scss'

import React from 'react'
import { connect } from 'react-redux'

import User from '../../../../../../core/user/user'
import DateUtils from '../../../../../../core/dateUtils'

import { useI18n } from '../../../../../commonComponents/hooks'
import ProfilePicture from '../../../../../commonComponents/profilePicture'

import * as AppState from '../../../../../app/appState'

const ActivityLog = props => {

  const { user } = props

  const i18n = useI18n()

  return (
    <div className="activity-log">

      <div className="activity-log__header">
        {i18n.t('homeView.activityLog.recentActivity')}
      </div>

      <div className="activity-log__content">

        {/*TODO: iterate over items*/}
        <div className="activity-log__content-item">
          <div className="activity">
            <ProfilePicture userUuid={User.getUuid(user)} thumbnail={true}/> {User.getName(user)} created the survey
          </div>
          <div className="date">
            {DateUtils.getRelativeDate(i18n, new Date())}
          </div>
        </div>

        <div className="activity-log__content-item-sep"></div>
        <div className="activity-log__content-item">
          <div className="activity">
            <ProfilePicture userUuid={User.getUuid(user)} thumbnail={true}/> {User.getName(user)} created the survey
          </div>
          <div className="date">
            {DateUtils.getRelativeDate(i18n, new Date())}
          </div>
        </div>
        <div className="activity-log__content-item-sep"></div>

      </div>

    </div>
  )

}

const mapStateToProps = state => ({
  user: AppState.getUser(state)
})

export default connect(mapStateToProps)(ActivityLog)