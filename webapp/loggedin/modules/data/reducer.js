import { combineReducers } from 'redux'

import records from './records/reducer'
import dataVis from './dataVis/reducer'

export default combineReducers({
  records,
  dataVis,
})