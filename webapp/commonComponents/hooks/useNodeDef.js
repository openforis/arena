import { useSelector } from 'react-redux'

import * as NodeDefState from '@webapp/loggedin/surveyViews/nodeDef/nodeDefState'

// Gets the nodeDef from the survey views node def state.
export default () => useSelector(NodeDefState.getNodeDef)
