import type * as AuthGroup from '@core/auth/authGroup'

export const keys = {
  accessRequestUuid: 'accessRequestUuid',
  email: 'email',
  surveyName: 'surveyName',
  surveyLabel: 'surveyLabel',
  role: 'role',
} as const

// acceptance of a user access request (creating the survey requested by the user)
export type UserAccessRequestAccept = {
  accessRequestUuid: string
  email: string
  surveyName: string
  surveyLabel?: string
  // name of the auth group of the user in the survey (or systemAdmin / surveyManager)
  role: (typeof AuthGroup.groupNames)[keyof typeof AuthGroup.groupNames]
  templateUuid?: string | null
}
