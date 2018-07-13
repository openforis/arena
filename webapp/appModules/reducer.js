import {
  exportReducer,
  assocActionProps,
} from '../app-utils/reduxUtils'

import { actionTypes } from './appModules'

const actionHandlers = {

  [actionTypes.appModulesDashboardDataLoaded]: assocActionProps,

  [actionTypes.appModulesDataLoaded]: assocActionProps,

}

export default exportReducer(actionHandlers)