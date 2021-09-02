import * as UserActions from './actions'
import * as UserState from './state'
import UserReducer from './reducer'
import {
  useUser,
  useAuthCanEditSurvey,
  useAuthCanEditRecord,
  useAuthCanCleanseRecords,
  useAuthCanDeleteAllRecords,
  useAuthCanEditUser,
  useAuthCanInviteUser,
  useAuthCanViewOtherUsersEmail,
  useUserIsSystemAdmin,
  useProfilePicture,
  usePreferedLang
} from './hooks'

export {
  UserActions,
  UserState,
  UserReducer,
  useUser,
  useAuthCanEditSurvey,
  useAuthCanEditRecord,
  useAuthCanCleanseRecords,
  useAuthCanDeleteAllRecords,
  useAuthCanEditUser,
  useAuthCanInviteUser,
  useAuthCanViewOtherUsersEmail,
  useUserIsSystemAdmin,
  useProfilePicture,
  usePreferedLang
}
