import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as DateUtils from '@core/dateUtils'

import { TestId } from '@webapp/utils/testId'
import { copyToClipboard } from '@webapp/utils/domUtils'
import * as API from '@webapp/service/api'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditUser } from '@webapp/store/user'
import { useSurveyInfo } from '@webapp/store/survey'
import { useOnInviteRepeat } from '@webapp/views/App/views/Users/UserEdit/store/actions/useOnInviteRepeat'
import { Button, ButtonInvite } from '@webapp/components'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import ProfilePicture from '@webapp/components/profilePicture'
import { NotificationActions } from '@webapp/store/ui'

const Row = (props) => {
  const { row: userListItem, emailVisible } = props
  const surveyInfo = useSurveyInfo()
  const surveyUuid = Survey.getUuid(surveyInfo)
  const surveyId = Survey.getId(surveyInfo)

  const dispatch = useDispatch()
  const i18n = useI18n()
  const canEditUser = useAuthCanEditUser(userListItem)

  const authGroup = User.getAuthGroupBySurveyUuid({ surveyUuid, defaultToMainGroup: true })(userListItem)
  const authGroupName = AuthGroup.getName(authGroup)
  const userUuid = User.getUuid(userListItem)
  const email = User.getEmail(userListItem)
  const invitedBy = User.getInvitedBy(userListItem)
  const invitedDate = User.getInvitedDate(userListItem)
  const invitedDateFormatted = DateUtils.convertDateTimeFromISOToDisplay(invitedDate) ?? ''
  const lastLoginTime = User.getLastLoginTime(userListItem)
  const lastLoginTimeFormatted = DateUtils.convertDateTimeFromISOToDisplay(lastLoginTime) ?? ''

  const handleResendInvitation = useOnInviteRepeat({ userToInvite: userListItem, hasToNavigate: false })
  const handleCopyInvitationLink = useCallback(
    async (e) => {
      e.stopPropagation()
      const url = await API.fetchUserResetPasswordUrl({ userUuid, surveyId })
      if (await copyToClipboard(url)) {
        dispatch(NotificationActions.notifyInfo({ key: 'usersView.invitationLinkCopiedToClipboard' }))
      }
    },
    [surveyId, userUuid]
  )

  return (
    <>
      <div data-testid={TestId.userList.profilePicture} className="users-list__cell-profile-picture">
        <ProfilePicture userUuid={userUuid} thumbnail />
      </div>
      <div data-testid={TestId.userList.name}>{User.getName(userListItem)}</div>
      {emailVisible && (
        <div data-testid={TestId.userList.email} data-value={email}>
          <LabelWithTooltip label={email} />
        </div>
      )}
      <div data-testid={TestId.userList.authGroup} data-value={authGroupName}>
        <LabelWithTooltip label={i18n.t(`authGroups.${authGroupName}.label_plural`)} />
      </div>
      <div data-testid={TestId.userList.invitedBy} data-value={invitedBy}>
        <LabelWithTooltip label={invitedBy} />
      </div>
      <div data-testid={TestId.userList.invitedDate} data-value={invitedDate}>
        {invitedDateFormatted}
      </div>
      <div>
        {User.hasAccepted(userListItem) && <span className="icon icon-user-check icon-16px" />}
        {User.isInvited(userListItem) && User.isInvitationExpired(userListItem) && (
          <span className="icon icon-crying icon-16px icon-invitation-expired" />
        )}
        {User.isInvited(userListItem) && (
          <div>
            <ButtonInvite className="icon-invitation-retry" onClick={handleResendInvitation} showLabel={false} />
            <Button
              className="icon-invitation-link"
              iconClassName="icon-link icon-12px"
              label="usersView.copyInvitationLink"
              onClick={handleCopyInvitationLink}
              showLabel={false}
            />
          </div>
        )}
      </div>
      <div data-testid={TestId.userList.lastLogin} data-value={lastLoginTime}>
        {lastLoginTimeFormatted}
      </div>
      <div data-testid={TestId.userList.edit}>
        <span className={`icon icon-12px icon-action ${canEditUser ? 'icon-pencil2' : 'icon-eye'}`} />
      </div>
    </>
  )
}

Row.propTypes = {
  row: PropTypes.object.isRequired,
  emailVisible: PropTypes.bool,
}

Row.defaultProps = {
  emailVisible: false,
}

export default Row
