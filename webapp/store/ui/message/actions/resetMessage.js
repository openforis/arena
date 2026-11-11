import { appModuleUri, systemAdminModules } from '@webapp/app/appModules'
import { MessageActionTypes } from './actionTypes'

export const resetMessage =
  ({ navigate }) =>
  async (dispatch) => {
    dispatch({ type: MessageActionTypes.messageReset })

    // navigate to messages list
    navigate(appModuleUri(systemAdminModules.messages))
  }
