import * as AuthGroup from '@core/auth/authGroup'
import * as DateUtils from '@core/dateUtils'
import * as Survey from '@core/survey/survey'
import * as User from '@core/user/user'
import { Button, ButtonIconEditOrView, ButtonInvite } from '@webapp/components'
import { LabelWithTooltip } from '@webapp/components/form/LabelWithTooltip'
import ProfilePicture from '@webapp/components/ProfilePicture'
import { useSurveyInfo } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { useAuthCanEditUser, useAuthCanViewOtherUsersEmail } from '@webapp/store/user'
import { TestId } from '@webapp/utils/testId'
import { useOnInviteRepeat } from '@webapp/views/Users/UserEdit/store/actions/useOnInviteRepeat'

import { CopyPasswordResetLinkButton } from './CopyResetPasswordLinkButton'

type RowProps = {
  item: Record<string, any>
  onEditSurveyUserExtraProps: (...args: any[]) => any
  onRowOpen: (...args: any[]) => any
}

const Row = (props: RowProps) => {
  const { onEditSurveyUserExtraProps, onRowOpen, item: userListItem } = props
  const surveyInfo = useSurveyInfo()
  const surveyUuid = Survey.getUuid(surveyInfo)
  const i18n = useI18n()
  const canEditUser = useAuthCanEditUser(userListItem)
  const emailVisible = useAuthCanViewOtherUsersEmail()

  const handleResendInvitation = useOnInviteRepeat({ userToInvite: userListItem, hasToNavigate: false })

  const authGroup = User.getAuthGroupBySurveyUuid({ surveyUuid, defaultToMainGroup: true })(userListItem)
  const authGroupName = AuthGroup.getName(authGroup)
  const userUuid = User.getUuid(userListItem)
  const email = User.getEmail(userListItem)
  const invitedBy = User.getInvitedBy(userListItem)
  const invitedDate = User.getInvitedDate(userListItem)
  const invitedDateFormatted = DateUtils.convertDateTimeFromISOToDisplay(invitedDate) ?? ''
  const lastLoginTime = User.getLastLoginTime(userListItem)
  const lastLoginTimeFormatted = DateUtils.convertDateTimeFromISOToDisplay(lastLoginTime) ?? ''

  return (
    <>
      <div data-testid={TestId.userList.profilePicture} className="users-list__cell-profile-picture">
        <ProfilePicture userUuid={userUuid} hasProfilePicture={User.hasProfilePicture(userListItem)} thumbnail />
      </div>
      <div data-testid={TestId.userList.name}>{User.getName(userListItem)}</div>
      {emailVisible && (
        <div data-testid={TestId.userList.email} data-value={email}>
          <LabelWithTooltip label={email} />
        </div>
      )}
      <div data-testid={TestId.userList.authGroup} data-value={authGroupName}>
        <LabelWithTooltip label={i18n.t(`auth:authGroups.${authGroupName}.label_other`)} />
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
            label="usersView:invitationExpiredClickToSendAgainTheInvitation"
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
            <CopyPasswordResetLinkButton email={email} messageType="invitation" userUuid={userUuid} />
          </>
        )}
      </div>
      <div data-testid={TestId.userList.lastLogin} data-value={lastLoginTime}>
        {lastLoginTimeFormatted}
      </div>
      <div>
        <Button
          iconClassName="icon-cog"
          title="usersView:editSurveyUserExtraPropsForUser"
          titleParams={{ userName: User.getName(userListItem) ?? User.getEmail(userListItem) }}
          onClick={() => onEditSurveyUserExtraProps(userListItem)}
          variant="text"
        />
      </div>
      <div data-testid={TestId.userList.edit}>
        <ButtonIconEditOrView canEdit={canEditUser} onClick={() => onRowOpen(userListItem)} />
      </div>
    </>
  )
}

export default Row
