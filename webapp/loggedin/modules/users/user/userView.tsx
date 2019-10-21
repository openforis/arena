import './userView.scss'

import React from 'react'
import { connect } from 'react-redux'

import Survey from '../../../../../core/survey/survey'

import { getUrlParam } from '../../../../utils/routerUtils'

import { useI18n } from '../../../../commonComponents/hooks'
import Dropdown from '../../../../commonComponents/form/dropdown'
import ProfilePicture from '../../../../commonComponents/profilePicture'
import { FormItem, Input } from '../../../../commonComponents/form/input'

import * as AppState from '../../../../app/appState'
import * as SurveyState from '../../../../survey/surveyState'

import { showAppLoader, hideAppLoader, showNotificationMessage, setUser } from '../../../../app/actions'

import { useUserViewState } from './useUserViewState'

import ProfilePictureEditor from './components/profilePictureEditor'

const UserView = props => {

  const { surveyInfo, lang, userUuid } = props

  const i18n = useI18n()

  const {
    ready, isInvitation,
    name, email, group, surveyGroupsMenuItems, objectValid,
    canEdit, canEditName, canEditGroup, canEditEmail, canRemove,
    getFieldValidation, setName, setEmail, setGroup,
    pictureEditorEnabled, setProfilePicture,
    saveUser, removeUser,
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
              maxLength={128}
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
          items={surveyGroupsMenuItems}
          itemKeyProp={'uuid'}
          itemLabelProp={'label'}
          selection={group}
          onChange={setGroup}
          readOnlyInput={true}/>
      </FormItem>

      {
        canEdit &&
        <div className="user-view__buttons">

          {
            canRemove &&
            <button className="btn-s btn-danger btn-remove-user"
                    onClick={() => {
                      const confirmMessage = i18n.t(
                        'userView.confirmRemove',
                        { user: name, survey: Survey.getLabel(surveyInfo, lang) }
                      )
                      window.confirm(confirmMessage) ? removeUser() : null
                    }}>
              <span className="icon icon-bin icon-left icon-10px"/>
              {i18n.t('userView.removeFromSurvey')}
            </button>
          }

          <button className="btn btn-save"
                  aria-disabled={!objectValid}
                  onClick={saveUser}>
            <span className={`icon icon-${isInvitation ? 'envelop' : 'floppy-disk'} icon-left icon-12px`}/>
            {isInvitation ? i18n.t('userView.sendInvitation') : i18n.t('common.save')}
          </button>
        </div>

      }
    </div>
  )
}

const mapStateToProps = (state, { match }) => ({
  user: AppState.getUser(state),
  surveyInfo: SurveyState.getSurveyInfo(state),
  lang: AppState.getLang(state),
  userUuid: getUrlParam('userUuid')(match),
})

export default connect(
  mapStateToProps,
  { showAppLoader, hideAppLoader, showNotificationMessage, setUser },
)(UserView)
