import './userInviteView.scss'

import React, { useState } from 'react'
import { connect } from 'react-redux'

import axios from 'axios'

import Survey from '../../../../../common/survey/survey'
import AuthGroups from '../../../../../common/auth/authGroups'

import * as SurveyState from '../../../../survey/surveyState'

import useI18n from '../../../../commonComponents/useI18n'
import { Input } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'

const UserInviteView = props => {
  const i18n = useI18n()

  const { groups: groups_, surveyId } = props

  const groups = groups_.map(g => ({
    id: g.id,
    label: i18n.t(`authGroups.${g.name}.label`)
  }))

  const [email, setEmail] = useState('')
  const [group, setGroup] = useState()

  const inviteUser = () => {
    const groupId = AuthGroups.getId(group)

    axios.post(`/api/survey/${surveyId}/users/invite`, { email, groupId })
  }

  return (
    <div className="user-invite">
      <div>
        <Input
          placeholder={i18n.t('common.email')}
          value={email}
          onChange={setEmail}/>
      </div>
      <div>
        <Dropdown
          placeholder={i18n.t('usersView.group')}
          items={groups}
          itemKeyProp={'id'}
          itemLabelProp={'label'}
          selection={group}
          onChange={setGroup}/>
      </div>
      <button className="btn"
              onClick={() => inviteUser()}>
        <span className="icon icon-plus icon-left icon-12px" />
        {i18n.t('usersView.inviteUser')}
      </button>
    </div>
  )
}

const mapStateToProps = state => {
  const survey = SurveyState.getSurvey(state)
  const authGroups = Survey.getAuthGroups(Survey.getSurveyInfo(survey))

  return {
    survey,
    groups: authGroups.map(g => ({ id: g.id, name: g.name }))
  }
}

export default connect(
  mapStateToProps,
)(UserInviteView)
