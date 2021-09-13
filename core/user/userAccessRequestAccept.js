import * as AuthGroup from '@core/auth/authGroup'

export const keys = {
  email: 'email',
  surveyName: 'surveyName',
  surveyLabel: 'surveyLabel',
  role: 'role',
}

export const requestAcceptRoles = [
  AuthGroup.groupNames.systemAdmin,
  AuthGroup.groupNames.surveyManager,
  AuthGroup.groupNames.surveyAdmin,
]
