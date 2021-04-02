import * as ObjectUtils from '@core/objectUtils'

export const keys = {
  uuid: ObjectUtils.keys.uuid,
  name: ObjectUtils.keys.name,
  email: 'email',
  password: 'password',
  lang: 'lang',
  authGroups: ObjectUtils.keys.authGroups,
  hasProfilePicture: 'hasProfilePicture',
  prefs: 'prefs',
  props: ObjectUtils.keys.props,
  status: 'status',
  validation: ObjectUtils.keys.validation,
  groupUuid: 'groupUuid', // Used only when editing user survey group
  invitationExpired: 'invitationExpired',
  invitedBy: 'invitedBy',
  invitedDate: 'invitedDate',
}
