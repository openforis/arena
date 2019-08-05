import './userInviteView.scss'

import React, { useState, useEffect } from 'react'
import { connect } from 'react-redux'

import { appModuleUri, userModules } from '../../../appModules'

import Survey from '../../../../../common/survey/survey'
import AuthGroups from '../../../../../common/auth/authGroups'
import UserValidator from '../../../../../common/user/userValidator'
import Validator from '../../../../../common/validation/validator'

import useI18n from '../../../../commonComponents/useI18n'
import { Input } from '../../../../commonComponents/form/input'
import Dropdown from '../../../../commonComponents/form/dropdown'
import { useAsyncPostRequest } from '../../../../commonComponents/hooks'

import * as SurveyState from '../../../../survey/surveyState'

import { showAppLoader, hideAppLoader } from '../../../../app/actions'

const UserInviteView = props => {
  const i18n = useI18n()

  const { surveyGroups, surveyId, history, showAppLoader, hideAppLoader } = props

  const [email, setEmail] = useState('')
  const [group, setGroup] = useState('')
  const [validation, setValidation] = useState({})
  const [validationEnabled, setValidationEnabled] = useState(false)

  const groups = surveyGroups.map(g => ({
    id: AuthGroups.getId(g),
    label: i18n.t(`authGroups.${AuthGroups.getName(g)}.label`)
  }))

  const { data, error, dispatch } = useAsyncPostRequest(
    `/api/survey/${surveyId}/users/invite`, {
      email,
      groupId: AuthGroups.getId(group)
    }
  )

  const inviteUser = () => {
    if (Validator.isValidationValid(validation)) {
      showAppLoader()
      dispatch()
    } else {
      setValidationEnabled(true)
    }
  }

  useEffect(() => {
    hideAppLoader()

    if (data) {
      history.push(appModuleUri(userModules.users))
    }
  }, [data, error])

  useEffect(() => {
    (async () => {
      const groupId = AuthGroups.getId(group)
      setValidation(await UserValidator.validateNewUser({ email, groupId }))
    })()
  }, [email, group])

  const getFieldValidation = field =>
    Validator.getFieldValidation(field)(validationEnabled ? validation : null)

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
    surveyId: Survey.getId(survey),
    surveyGroups: authGroups.map(g => ({ id: g.id, name: g.name }))
  }
}

export default connect(mapStateToProps, { showAppLoader, hideAppLoader })(UserInviteView)
