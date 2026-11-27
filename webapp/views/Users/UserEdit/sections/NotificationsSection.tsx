import * as ProcessUtils from '@core/processUtils'
import { Switch } from '@webapp/components'
import { UserEditSection, UserEditSectionRow } from '../UserEditSection'

type Props = {
  notifyOnUserAccessRequest: boolean
  onNotifyOnUserAccessRequestChange: (value: boolean) => void
  notifyOnUserSelfRegistration: boolean
  onNotifyOnUserSelfRegistrationChange: (value: boolean) => void
}

/**
 * Emails sent to the logged-in system administrator.
 */
export const NotificationsSection = (props: Props) => {
  const {
    notifyOnUserAccessRequest,
    onNotifyOnUserAccessRequestChange,
    notifyOnUserSelfRegistration,
    onNotifyOnUserSelfRegistrationChange,
  } = props
  // with self-registration the access requests are accepted automatically: only that notification applies
  const selfRegistration = ProcessUtils.ENV.allowUserSelfRegistration
  return (
    <UserEditSection
      description="usersView:profile.sections.notificationsDescription"
      id="user-edit-notifications"
      title="usersView:prefs.title"
    >
      <div className="user-edit-section__rows">
        {selfRegistration ? (
          <UserEditSectionRow
            description="usersView:profile.notifyOnUserSelfRegistrationDescription"
            title="usersView:prefs.notifyOnUserSelfRegistration"
          >
            <Switch checked={notifyOnUserSelfRegistration} onChange={onNotifyOnUserSelfRegistrationChange} />
          </UserEditSectionRow>
        ) : (
          <UserEditSectionRow
            description="usersView:profile.notifyOnUserAccessRequestDescription"
            title="usersView:prefs.notifyOnUserAccessRequest"
          >
            <Switch checked={notifyOnUserAccessRequest} onChange={onNotifyOnUserAccessRequestChange} />
          </UserEditSectionRow>
        )}
      </div>
    </UserEditSection>
  )
}
