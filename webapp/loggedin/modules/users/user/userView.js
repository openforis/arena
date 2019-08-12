import './userView.scss'

import React, { useEffect, useState } from 'react'
import * as R from 'ramda'

import { connect } from 'react-redux'

import useI18n from '../../../../commonComponents/useI18n.js'

import { useFormObject, useAsyncGetRequest, useAsyncPutRequest } from '../../../../commonComponents/hooks'
import Dropdown from '../../../../commonComponents/form/dropdown'
import { FormItem, Input } from '../../../../commonComponents/form/input'
import * as SurveyState from '../../../../survey/surveyState'

import Survey from '../../../../../common/survey/survey'
import User from '../../../../../common/user/user'
import AuthGroups from '../../../../../common/auth/authGroups'
import UserValidator from '../../../../../common/user/userValidator'
import Authorizer from '../../../../../common/auth/authorizer'

import * as AppState from '../../../../app/appState'
import { showAppLoader } from '../../../../app/actions'

const UserView = props => {
  const { surveyId, userUuidUrlParam, groups: groupsProps } = props

  const i18n = useI18n()

  const {
    object: formValues, objectValid,
    setObjectField, enableValidation, getFieldValidation
  } = useFormObject({
    name: '',
    // email: '',
    groupUuid: null,
  }, UserValidator.validateUser)

  // init groups
  const surveyGroups = groupsProps.map(g => ({
    uuid: AuthGroups.getUuid(g),
    label: i18n.t(`authGroups.${AuthGroups.getName(g)}.label`)
  }))

  const { data: user = {}, dispatch: fetchUser } = useAsyncGetRequest(
    `/api/survey/${surveyId}/user/${userUuidUrlParam}`,
    {}
  )
  useEffect(fetchUser, [])

  useEffect(() => {
    if (!R.isEmpty(user)) {
      const { name, authGroups } = user

      // look for current survey's group in returned user object
      const userGroup = authGroups.find(g => AuthGroups.getSurveyId(g) === surveyId)
      setName(name)
      // setEmail(email)
      setGroup(userGroup)
    }
  }, [user])

  const { data: response, dispatch: putUser} = useAsyncPutRequest(
    `/api/user/${User.getUuid(user)}`,
    {
      name: formValues.name,
      groupUuid: formValues.groupUuid,
    }
  )

  const updateUser = () => {
    if (objectValid) {
      showAppLoader()
      putUser()
    } else {
      enableValidation()
    }
  }

  const setName = name => setObjectField('name', name)

  // const setEmail = email => setObjectField('email', email)

  const setGroup = group => {
    const groupUuid = AuthGroups.getUuid(group)
    setObjectField('groupUuid', groupUuid)
  }

  const { name } = formValues
  const group = surveyGroups.find(R.propEq('uuid', formValues.groupUuid))

  return (
    <div className="form user">
      <FormItem label={i18n.t('common.email')}>
        <Input
          value={user.email}
          disabled={true}/>
      </FormItem>
      <FormItem label={i18n.t('common.name')}>
        <Input
          placeholder={i18n.t('common.name')}
          value={name}
          validation={getFieldValidation('name')}
          onChange={setName}/>
      </FormItem>
      <FormItem label={i18n.t('common.group')}>
        <Dropdown
          validation={getFieldValidation('groupUuid')}
          placeholder={i18n.t('common.group')}
          items={surveyGroups}
          itemKeyProp={'uuid'}
          itemLabelProp={'label'}
          selection={group}
          onChange={setGroup}/>
      </FormItem>
      <button className="btn"
              onClick={updateUser}>
        <span className="icon icon-floppy-disk icon-left icon-12px"/>
        Save
      </button>
    </div>
  )
}

const mapStateToProps = (state, { match }) => {
  const survey = SurveyState.getSurvey(state)
  const groups = Survey.getAuthGroups(Survey.getSurveyInfo(survey))
  const user = AppState.getUser(state)

  if (Authorizer.isSystemAdmin(user)) {
    const adminGroup = User.getAuthGroupAdmin(user)
    groups.unshift(adminGroup)
  }

  return {
    surveyId: Survey.getId(survey),
    groups,
    userUuidUrlParam: R.path(['params', 'userUuid'], match),
  }
}

// const enhance = compose(
//   withRouter,
//   connect(
//     mapStateToProps,
//     {
//       resetForm, checkInRecord, checkOutRecord,
//       recordNodesUpdate, nodeValidationsUpdate, dispatchRecordDelete
//     }
//   )
// )

export default connect(mapStateToProps)(UserView)
