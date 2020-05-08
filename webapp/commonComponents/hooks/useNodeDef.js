import { useSelector } from 'react-redux'

import * as NodeDefState from '@webapp/loggedin/surveyViews/nodeDef/nodeDefState'

// Gets the nodeDef from the survey views node def state.
export const useNodeDef = () => useSelector(NodeDefState.getNodeDef)

export const useNodeDefValidation = () => useSelector(NodeDefState.getValidation)

export const useNodeDefIsDirty = () => useSelector(NodeDefState.isDirty)
