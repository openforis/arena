import './userView.scss'

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useParams } from 'react-router'

import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import { DialogConfirmActions } from '@webapp/store/ui'
import { SurveyState } from '@webapp/store/survey'

import { useI18n } from '@webapp/components/hooks'
import ProfilePicture from '@webapp/components/profilePicture'
import { FormItem, Input } from '@webapp/components/form/input'

import ProfilePictureEditor from './components/profilePictureEditor'
import DropdownUserGroup from '../components/dropdownUserGroup'

import { useUserViewState } from './useUserViewState'

import { saveUser, removeUser, updateUserProp, updateUserProfilePicture, inviteUserRepeat } from './actions'

const UserView = () => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const surveyInfo = useSelector(SurveyState.getSurveyInfo)
  const { userUuid } = useParams()
  const history = useHistory()

  const { ready, user, userToUpdate, canEdit, canEditName, canEditGroup, canEditEmail, canRemove } = useUserViewState()

  const validation = User.getValidation(userToUpdate)

  return (
    ready && (
      <div className="user form">
        {canEdit ? (
          <ProfilePictureEditor
            userUuid={userUuid}
            onPictureUpdate={(profilePicture) => dispatch(updateUserProfilePicture(profilePicture))}
            enabled
          />
        ) : (
          <ProfilePicture userUuid={userUuid} />
        )}

        <FormItem label={i18n.t('common.name')}>
          <Input
            disabled={!canEditName}
            placeholder={canEditName ? i18n.t('common.name') : i18n.t('usersView.notAcceptedYet')}
            value={User.getName(userToUpdate)}
            validation={canEditName ? Validation.getFieldValidation(User.keys.name)(validation) : {}}
            maxLength={User.nameMaxLength}
            onChange={(value) => dispatch(updateUserProp(User.keys.name, value))}
          />
        </FormItem>
        <FormItem label={i18n.t('common.email')}>
          <Input
            disabled={!canEditEmail}
            placeholder={i18n.t('common.email')}
            value={User.getEmail(userToUpdate)}
            validation={Validation.getFieldValidation(User.keys.email)(validation)}
            onChange={(value) => dispatch(updateUserProp(User.keys.email, value))}
          />
        </FormItem>
        <FormItem label={i18n.t('common.group')}>
          <DropdownUserGroup
            editingLoggedUser={User.isEqual(user)(userToUpdate)}
            disabled={!canEditGroup}
            validation={Validation.getFieldValidation(User.keys.groupUuid)(validation)}
            groupUuid={User.getGroupUuid(userToUpdate)}
            onChange={(groupUuid) => dispatch(updateUserProp(User.keys.groupUuid, groupUuid))}
          />
        </FormItem>

        {(canEdit || User.isInvitationExpired(userToUpdate)) && (
          <div className="user__buttons">
            {canRemove && (
              <button
                type="button"
                className="btn-s btn-danger btn-remove-user"
                onClick={() =>
                  dispatch(
                    DialogConfirmActions.showDialogConfirm({
                      key: 'userView.confirmRemove',
                      params: {
                        user: User.getName(userToUpdate),
                        survey: Survey.getLabel(surveyInfo, i18n.lang),
                      },
                      onOk: () => dispatch(removeUser(history)),
                    })
                  )
                }
              >
                <span className="icon icon-bin icon-left icon-10px" />
                {i18n.t('userView.removeFromSurvey')}
              </button>
            )}

            {canEdit && (
              <button
                type="button"
                className="btn btn-save"
                aria-disabled={!Validation.isValid(validation)}
                onClick={() => dispatch(saveUser(history))}
              >
                <span className="icon icon-floppy-disk icon-left icon-12px" />
                {i18n.t('common.save')}
              </button>
            )}

            {User.isInvitationExpired(userToUpdate) && (
              <button type="button" className="btn btn-invite" onClick={() => dispatch(inviteUserRepeat(history))}>
                <span className="icon icon-envelop icon-left icon-12px" />
                {i18n.t('userView.sendNewInvitation')}
              </button>
            )}
          </div>
        )}
      </div>
    )
  )
}

export default UserView
