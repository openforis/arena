import * as R from 'ramda'

import { assocActionProps, exportReducer } from '../appUtils/reduxUtils'

import { recordCreated } from '../record/actions'
import { assocCurrentRecord } from '../record/recordState'

const actionHandlers = {

  //record
  [recordCreated]: (state, {record}) => assocCurrentRecord(record)(state)

}

export default exportReducer(actionHandlers)