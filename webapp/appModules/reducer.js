import {
  exportReducer,
  assocActionProps,
} from '../appUtils/reduxUtils'

import { actionTypes } from './appModules'

const actionHandlers = {

  [actionTypes.appModulesDashboardDataLoaded]: assocActionProps,

  [actionTypes.appModulesDataLoaded]: assocActionProps,

}

export default exportReducer(actionHandlers)