import './userInviteView.scss'

import * as R from 'ramda'

import React from 'react'
import { connect } from 'react-redux'

import User from '../../../../../common/user/user'
import Survey from '../../../../../common/survey/survey'
import Authorizer from '../../../../../common/auth/authorizer'

import useI18n from '../../../../commonComponents/useI18n'
import { Input } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'

import * as AppState from '../../../../app/appState'
import * as SurveyState from '../../../../survey/surveyState'

import { showAppLoader, hideAppLoader, showNotificationMessage } from '../../../../app/actions'
import { useUserInviteState } from './userInviteState'

const UserInviteView = props => {
  const i18n = useI18n()

  const {
    email, group, groups,
    getFieldValidation, setEmail, setGroup, inviteUser
  } = useUserInviteState(props)

  return (
    <div className="user-invite">
      <div>
        <Input
          placeholder={i18n.t('common.email')}
          value={email}
          validation={getFieldValidation('email')}
          onChange={setEmail}/>
      </div>
      <div>
        <Dropdown
          validation={getFieldValidation('groupId')}
          placeholder={i18n.t('common.group')}
          items={groups}
          itemKeyProp={'id'}
          itemLabelProp={'label'}
          selection={group}
          onChange={setGroup}/>
      </div>
      <button className="btn"
              onClick={() => inviteUser()}>
        <span className="icon icon-envelop icon-left icon-12px"/>
        {i18n.t('usersView.sendInvitation')}
      </button>
    </div>
  )
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const surveyGroups = Survey.getAuthGroups(Survey.getSurveyInfo(survey))
  const user = AppState.getUser(state)

  const groups = R.clone(surveyGroups)
  if (Authorizer.isSystemAdmin(user)) {
    const adminGroup = User.getAuthGroupAdmin(user)
    groups.unshift(adminGroup)
  }

  return {
    surveyId: Survey.getId(survey),
    groups
  }
}

export default connect(
  mapStateToProps,
  { showAppLoader, hideAppLoader, showNotificationMessage }
)(UserInviteView)
