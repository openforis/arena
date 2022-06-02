import * as AuthGroup from '@core/auth/authGroup'

export const keys = {
  accessRequestUuid: 'accessRequestUuid',
  email: 'email',
  surveyName: 'surveyName',
  surveyLabel: 'surveyLabel',
  role: 'role',
}

export const requestAcceptRoles = [AuthGroup.groupNames.systemAdmin, AuthGroup.groupNames.surveyManager]
