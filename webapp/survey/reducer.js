import { assocActionProps, exportReducer, } from '../app-utils/reduxUtils'

import { surveyCurrentUpdate, surveyNewUpdate, } from './actions'

const actionHandlers = {

  [surveyNewUpdate]: assocActionProps,
  [surveyCurrentUpdate]: assocActionProps,

}

export default exportReducer(actionHandlers)