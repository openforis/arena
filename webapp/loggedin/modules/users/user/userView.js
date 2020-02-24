import './userView.scss'

import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useHistory, useParams } from 'react-router'
import * as R from 'ramda'

import * as User from '@core/user/user'
import * as Survey from '@core/survey/survey'
import * as Validation from '@core/validation/validation'

import { useI18n } from '@webapp/commonComponents/hooks'
import ProfilePicture from '@webapp/commonComponents/profilePicture'
import { FormItem, Input } from '@webapp/commonComponents/form/input'

import ProfilePictureEditor from './components/profilePictureEditor'
import UserGroupDropdown from './components/userGroupDropdown'

import * as SurveyState from '@webapp/survey/surveyState'
import { useUserViewState } from './useUserViewState'

import { showDialogConfirm } from '@webapp/app/appDialogConfirm/actions'

import { saveUser, removeUser, updateUserProp, updateUserProfilePicture } from './actions'

const UserView = props => {
  const i18n = useI18n()
  const dispatch = useDispatch()
  const surveyInfo = useSelector(SurveyState.getSurveyInfo)
  const { userUuid } = useParams()
  const history = useHistory()

  const {
    ready,
    user,
    userToUpdate,
    canEdit,
    canEditName,
    canEditGroup,
    canEditEmail,
    canRemove,
    pictureEditorEnabled,
  } = useUserViewState(props)

  const isInvitation = R.isNil(userUuid)
  const validation = User.getValidation(userToUpdate)

  return (
    ready && (
      <div className="user-view form">
        {!isInvitation &&
          (canEdit ? (
            <ProfilePictureEditor
              userUuid={userUuid}
              onPictureUpdate={profilePicture => dispatch(updateUserProfilePicture(profilePicture))}
              enabled={pictureEditorEnabled}
            />
          ) : (
            <ProfilePicture userUuid={userUuid} />
          ))}

        {!isInvitation && (
          <FormItem label={i18n.t('common.name')}>
            <Input
              disabled={!canEditName}
              placeholder={canEditName ? i18n.t('common.name') : i18n.t('usersView.notAcceptedYet')}
              value={User.getName(userToUpdate)}
              validation={canEditName ? Validation.getFieldValidation(User.keys.name)(validation) : {}}
              maxLength={User.nameMaxLength}
              onChange={value => dispatch(updateUserProp(User.keys.name, value))}
            />
          </FormItem>
        )}
        <FormItem label={i18n.t('common.email')}>
          <Input
            disabled={!canEditEmail}
            placeholder={i18n.t('common.email')}
            value={User.getEmail(userToUpdate)}
            validation={Validation.getFieldValidation(User.keys.email)(validation)}
            onChange={value => dispatch(updateUserProp(User.keys.email, value))}
          />
        </FormItem>
        <FormItem label={i18n.t('common.group')}>
          <UserGroupDropdown
            editingLoggedUser={User.isEqual(user)(userToUpdate)}
            disabled={!canEditGroup}
            validation={Validation.getFieldValidation(User.keys.groupUuid)(validation)}
            selectedGroupUuid={User.getGroupUuid(userToUpdate)}
            onChange={groupUuid => dispatch(updateUserProp(User.keys.groupUuid, groupUuid))}
          />
        </FormItem>

        {canEdit && (
          <div className="user-view__buttons">
            {canRemove && (
              <button
                className="btn-s btn-danger btn-remove-user"
                onClick={() =>
                  dispatch(
                    showDialogConfirm(
                      'userView.confirmRemove',
                      {
                        user: User.getName(userToUpdate),
                        survey: Survey.getLabel(surveyInfo, i18n.lang),
                      },
                      () => dispatch(removeUser(history)),
                    ),
                  )
                }
              >
                <span className="icon icon-bin icon-left icon-10px" />
                {i18n.t('userView.removeFromSurvey')}
              </button>
            )}

            <button
              className="btn btn-save"
              aria-disabled={!Validation.isValid(validation)}
              onClick={() => dispatch(saveUser(history))}
            >
              <span className={`icon icon-${isInvitation ? 'envelop' : 'floppy-disk'} icon-left icon-12px`} />
              {isInvitation ? i18n.t('userView.sendInvitation') : i18n.t('common.save')}
            </button>
          </div>
        )}
      </div>
    )
  )
}

export default UserView
