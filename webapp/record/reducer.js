import { exportReducer } from '../appUtils/reduxUtils'

import { nodeDeleted, recordCreated, recordUpdated } from '../record/actions'
import { assocCurrentRecord, deleteNodeAndChildren, updateNodes } from '../record/recordState'

const actionHandlers = {

  //record
  [recordCreated]: (state, {record}) => assocCurrentRecord(record)(state),

  [recordUpdated]: (state, {updatedNodes}) => updateNodes(updatedNodes, state),

  [nodeDeleted]: (state, {node}) => deleteNodeAndChildren(node, state),
}

export default exportReducer(actionHandlers)