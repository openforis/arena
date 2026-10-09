/**
 * ApplierDeps on the app store: the same thunks and actions as the form designer's useSaveEdits.
 */
import * as SurveyState from '@webapp/store/survey/state'
import * as SurveyStatusState from '@webapp/store/survey/status/state'
import * as NodeDefsActions from '@webapp/store/survey/nodeDefs/actions'

import type { ApplierDeps } from './applyChangeSet'

/**
 * Creates the applier dependencies.
 * @param {object} params - Parameters.
 * @param {Function} params.dispatch - Redux dispatch.
 * @param {Function} params.getState - Redux getState.
 * @returns {ApplierDeps} The dependencies.
 */
export const createApplierDeps = ({
  dispatch,
  getState,
}: {
  dispatch: (action: any) => any
  getState: () => any
}): ApplierDeps => ({
  getSurvey: () => SurveyState.getSurvey(getState()),
  getCycle: () => SurveyState.getSurveyCycleKey(getState()),
  isSurveyDirty: () => SurveyStatusState.isDirty(getState()),
  postNodeDef: async (nodeDef) => {
    await dispatch(NodeDefsActions.postNodeDef({ nodeDef }))
  },
  putNodeDefProps: async (params) => {
    await dispatch(NodeDefsActions.putNodeDefProps(params))
  },
  onNodeDefCreated: (nodeDef) => dispatch({ type: NodeDefsActions.nodeDefCreate, nodeDef }),
  onNodeDefUpdated: (nodeDef) => dispatch(NodeDefsActions.updateNodeDef({ nodeDef })),
  onNodeDefSaved: ({ nodeDef, nodeDefParent }) =>
    dispatch(
      NodeDefsActions.saveNodeDef({
        nodeDef,
        nodeDefParent,
        surveyCycleKey: SurveyState.getSurveyCycleKey(getState()),
        nodeDefValidation: null,
      })
    ),
})
