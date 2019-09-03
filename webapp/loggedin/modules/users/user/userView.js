import './userView.scss'

import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { getUrlParam } from '../../../../utils/routerUtils'

import useI18n from '../../../../commonComponents/useI18n.js'

import Dropdown from '../../../../commonComponents/form/dropdown'
import ProfilePicture from '../../../../commonComponents/profilePicture'
import { FormItem, Input } from '../../../../commonComponents/form/input'

import Survey from '../../../../../common/survey/survey'
import User from '../../../../../common/user/user'
import Authorizer from '../../../../../common/auth/authorizer'

import * as AppState from '../../../../app/appState'
import * as SurveyState from '../../../../survey/surveyState'

import { showAppLoader, hideAppLoader, showNotificationMessage, setUser } from '../../../../app/actions'

import { useUserViewState } from './useUserViewState'

import ProfilePictureEditor from './components/profilePictureEditor'

const UserView = props => {

  const { userUuid } = props

  const i18n = useI18n()

  const {
    ready, isInvitation,
    name, email, group, surveyGroups, objectValid,
    canEdit, canEditName, canEditGroup, canEditEmail,
    getFieldValidation, setName, setEmail, setGroup,
    setProfilePicture,
    pictureEditorEnabled,
    sendRequest,
  } = useUserViewState(props)

  return ready && (

    <div className="user-view form">
      {
        !isInvitation && (
          canEdit
            ? (
              <ProfilePictureEditor
                userUuid={userUuid}
                onPictureUpdate={setProfilePicture}
                enabled={pictureEditorEnabled}/>
            )
            : (
              <ProfilePicture userUuid={userUuid}/>
            )
        )
      }

      {
        !isInvitation && (
          <FormItem label={i18n.t('common.name')}>
            <Input
              disabled={!canEditName}
              placeholder={canEditName ? i18n.t('common.name') : i18n.t('usersView.notAcceptedYet')}
              value={name}
              validation={canEditName ? getFieldValidation('name') : {}}
              maxLength="128"
              onChange={setName}/>
          </FormItem>
        )
      }
      <FormItem label={i18n.t('common.email')}>
        <Input
          disabled={!canEditEmail}
          placeholder={i18n.t('common.email')}
          value={email}
          validation={getFieldValidation('email')}
          onChange={setEmail}/>
      </FormItem>
      <FormItem label={i18n.t('common.group')}>
        <Dropdown
          disabled={!canEditGroup}
          validation={getFieldValidation('groupUuid')}
          placeholder={i18n.t('common.group')}
          items={surveyGroups}
          itemKeyProp={'uuid'}
          itemLabelProp={'label'}
          selection={group}
          onChange={setGroup}
          readOnlyInput={true}/>
      </FormItem>

      {
        canEdit && (
          <button className="btn"
                  aria-disabled={!objectValid}
                  onClick={sendRequest}>
            <span className={`icon icon-${isInvitation ? 'envelop' : 'floppy-disk'} icon-left icon-12px`}/>
            {isInvitation ? i18n.t('usersView.sendInvitation') : i18n.t('common.save')}
          </button>
        )
      }
    </div>
  )
}

const mapStateToProps = (state, { match }) => {
  const surveyInfo = SurveyState.getSurveyInfo(state)
  const user = AppState.getUser(state)

  const groups = R.when(
    R.always(Authorizer.isSystemAdmin(user)),
    R.concat(User.getAuthGroups(user))
  )(Survey.getAuthGroups(surveyInfo))

  return {
    user,
    surveyInfo,
    groups,
    userUuid: getUrlParam('userUuid')(match),
  }
}

export default connect(
  mapStateToProps,
  { showAppLoader, hideAppLoader, showNotificationMessage, setUser },
)(UserView)
