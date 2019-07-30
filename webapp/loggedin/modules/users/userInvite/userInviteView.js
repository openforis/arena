import * as R from 'ramda'

import './userInviteView.scss'

import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'

import axios from 'axios'

import Survey from '../../../../../common/survey/survey'
import AuthGroups from '../../../../../common/auth/authGroups'

import * as SurveyState from '../../../../survey/surveyState'

import useI18n from '../../../../commonComponents/useI18n'
import { Input } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'

import UserValidator from '../../../../../common/user/userValidator'
import Validator from '../../../../../common/validation/validator'

// import { useOnUpdate } from '../../../../commonComponents/hooks'

const UserInviteView = props => {
  const i18n = useI18n()

  const { surveyGroups, surveyId } = props

  const [email, setEmail] = useState('')
  const [group, setGroup] = useState('')
  const [newUser, setNewUser] = useState({})
  const [validation, setValidation] = useState({ valid: true })
  const [clientValidationEnabled, enableClientValidation] = useState(false)

  const groups = surveyGroups.map(g => ({
    id: g.id,
    label: i18n.t(`authGroups.${g.name}.label`)
  }))

  const inviteUser = async () => {
    const validation = await UserValidator.validateNewUser(newUser)

    if (Validator.isValid(validation)) {
      const groupId = AuthGroups.getId(group)
      const { data } = await axios.post(`/api/survey/${surveyId}/users/invite`, { email, groupId })

      if (R.pathOr(true, ['validation', 'valid'])(data)) {
        setNewUser(data)
      } else {
        setValidation(data.validation)
      }
    }

    enableClientValidation(true)
  }

  useEffect(() => {
    if (clientValidationEnabled) {
      (async () => {
        setValidation(await UserValidator.validateNewUser(newUser))
      })()
    }
  }, [newUser, clientValidationEnabled])

  useEffect(() => {
    setNewUser({ email, groupId: group.id })
  }, [email, group])

  return (
    <div className="user-invite">
      <div>
        <Input
          placeholder={i18n.t('common.email')}
          value={email}
          validation={Validator.getFieldValidation('email')(validation)}
          onChange={setEmail}/>
      </div>
      <div>
        <Dropdown
          validation={Validator.getFieldValidation('groupId')(validation)}
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
    surveyGroups: authGroups.map(g => ({ id: g.id, name: g.name }))
  }
}

export default connect(
  mapStateToProps,
)(UserInviteView)
