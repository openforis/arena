import React from 'react'
import PropTypes from 'prop-types'

import * as AuthGroup from '@core/auth/authGroup'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import * as DateUtils from '@core/dateUtils'

import { TestId } from '@webapp/utils/testId'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditUser, useAuthCanViewOtherUsersEmail } from '@webapp/store/user'
import { useSurveyInfo } from '@webapp/store/survey'
import { useOnInviteRepeat } from '@webapp/views/App/views/Users/UserEdit/store/actions/useOnInviteRepeat'
import { Button, ButtonInvite } from '@webapp/components'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import ProfilePicture from '@webapp/components/profilePicture'
import { CopyInvitationLinkButton } from './CopyInvitationLinkButton'

const Row = (props) => {
  const { row: userListItem } = props
  const surveyInfo = useSurveyInfo()
  const surveyUuid = Survey.getUuid(surveyInfo)
  const i18n = useI18n()
  const canEditUser = useAuthCanEditUser(userListItem)
  const emailVisible = useAuthCanViewOtherUsersEmail()

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
      <div className="accepted-cell">
        {User.hasAccepted(userListItem) && <span className="icon icon-user-check icon-16px" />}
        {User.isInvited(userListItem) && User.isInvitationExpired(userListItem) && (
          <Button
            className="icon-invitation-expired"
            iconClassName="icon-crying icon-16px"
            label="usersView.invitationExpiredClickToSendAgainTheInvitation"
            onClick={handleResendInvitation}
            showLabel={false}
            variant="text"
          />
        )}
        {User.isInvited(userListItem) && (
          <>
            <ButtonInvite
              className="icon-invitation-retry"
              onClick={handleResendInvitation}
              showLabel={false}
              variant="text"
            />
            <CopyInvitationLinkButton email={email} userUuid={userUuid} />
          </>
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
}

export default Row
