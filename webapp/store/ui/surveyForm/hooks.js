import { useSelector } from 'react-redux'

import * as Authorizer from '@core/auth/authorizer'

import { useSurveyInfo } from '@webapp/store/survey'

import * as UserState from './state'

export const useUser = () => useSelector(UserState.getUser)

// ====== Auth
export const useAuthCanEditSurvey = () => Authorizer.canEditSurvey(useUser(), useSurveyInfo())
export const useAuthCanEditRecord = (record) => Authorizer.canEditRecord(useUser(), record)
export const useAuthCanCleanseRecords = () => Authorizer.canCleanseRecords(useUser(), useSurveyInfo())
export const useAuthCanEditUser = (user) => Authorizer.canEditUser(useUser(), useSurveyInfo(), user)
export const useAuthCanInviteUser = () => Authorizer.canInviteUsers(useUser(), useSurveyInfo())
