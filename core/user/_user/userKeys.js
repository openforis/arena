import * as ObjectUtils from '@core/objectUtils'
import * as Validation from '@core/validation/validation'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  name: ObjectUtils.keys.name,
  email: 'email',
  password: 'password',
  lang: 'lang',
  authGroups: ObjectUtils.keys.authGroups,
  hasProfilePicture: 'hasProfilePicture',
  prefs: 'prefs',
  profilePicture: 'profilePicture',
  props: ObjectUtils.keys.props,
  status: 'status',
  validation: Validation.keys.validation,
  invitationExpired: 'invitationExpired',
  invitedBy: 'invitedBy',
  invitedDate: 'invitedDate',
  lastLoginTime: 'lastLoginTime',
  resetPasswordUuid: 'resetPasswordUuid',

  // Used only when editing user auth groups
  authGroupsUuids: 'authGroupsUuids',
  authGroupExtraProps: 'authGroupExtraProps',

  // Used only in list view
  surveysCountDraft: 'surveysCountDraft',
  surveysCountPublished: 'surveysCountPublished',

  // used in user update to determine if profile picture is to be persisted
  profilePictureSet: 'profilePictureSet',

  // used when creating a new user
  newPassword: 'newPassword',
  confirmPassword: 'confirmPassword',
}
