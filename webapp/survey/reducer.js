import { assocActionProps, exportReducer, } from '../app-utils/reduxUtils'

import { surveyNewUpdate, } from './actions'

const actionHandlers = {

  [surveyNewUpdate]: assocActionProps,

}

export default exportReducer(actionHandlers)