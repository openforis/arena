import './userView.scss'

import React from 'react'
import * as R from 'ramda'

import { connect } from 'react-redux'

import useI18n from '../../../../commonComponents/useI18n.js'

import Dropdown from '../../../../commonComponents/form/dropdown'
import { FormItem, Input } from '../../../../commonComponents/form/input'
import * as SurveyState from '../../../../survey/surveyState'

import Survey from '../../../../../common/survey/survey'
import User from '../../../../../common/user/user'
import Authorizer from '../../../../../common/auth/authorizer'

import * as AppState from '../../../../app/appState'
import { showAppLoader, hideAppLoader, showNotificationMessage } from '../../../../app/actions'

import { useUserViewState } from './userViewState'

const UserView = props => {
  const i18n = useI18n()

  const {
    name, email, group, surveyGroups, objectValid,
    getFieldValidation, setName, setEmail, setGroup, updateUser
  } = useUserViewState(props)

  return (
    <div className="form user">
      <FormItem label={i18n.t('common.email')}>
        <Input
          placeholder={i18n.t('common.email')}
          value={email}
          validation={getFieldValidation('email')}
          onChange={setEmail}/>
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
              aria-disabled={!objectValid}
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

export default connect(
  mapStateToProps,
  { showAppLoader, hideAppLoader, showNotificationMessage },
)(UserView)
