import { Switch } from '@webapp/components'
import { UserEditSection, UserEditSectionRow } from '../UserEditSection'

type Props = {
  notifyOnUserAccessRequest: boolean
  onNotifyOnUserAccessRequestChange: (value: boolean) => void
}

/**
 * Emails sent to the logged-in system administrator.
 */
export const NotificationsSection = (props: Props) => {
  const { notifyOnUserAccessRequest, onNotifyOnUserAccessRequestChange } = props
  return (
    <UserEditSection
      description="usersView:profile.sections.notificationsDescription"
      id="user-edit-notifications"
      title="usersView:prefs.title"
    >
      <div className="user-edit-section__rows">
        <UserEditSectionRow
          description="usersView:profile.notifyOnUserAccessRequestDescription"
          title="usersView:prefs.notifyOnUserAccessRequest"
        >
          <Switch checked={notifyOnUserAccessRequest} onChange={onNotifyOnUserAccessRequestChange} />
        </UserEditSectionRow>
      </div>
    </UserEditSection>
  )
}
