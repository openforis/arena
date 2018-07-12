import {
  exportReducer,
  assocActionProps,
} from '../../app-utils/reduxUtils'

import { actionTypes } from '../surveyDashboard'

const actionHandlers = {

  [actionTypes.surveyDashboardDataComponentLoaded]: assocActionProps,

}

export default exportReducer(actionHandlers)