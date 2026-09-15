import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useDispatch } from 'react-redux'

import * as NodeDef from '@core/survey/nodeDef'

import { analysisModules, appModuleUri, designerModules } from '@webapp/app/appModules'

import { useCancelEdits } from './useCancelEdits'
import { useGetSiblingNodeDefUuid } from './useGetSiblingNodeDefUuid'
import { SurveyFormActions, useIsEditingNodeDefInFullScreen } from '@webapp/store/ui/surveyForm'
import { State } from '../state'

export const useGoToNodeDef = ({ setState }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const editingNodeDefInFullScreen = useIsEditingNodeDefInFullScreen()

  const cancelEdits = useCancelEdits({ setState })

  const getSiblingNodeDefUuid = useGetSiblingNodeDefUuid()

  return useCallback(
    async ({ state, offset }) => {
      cancelEdits({
        state,
        offset,
        onCancel: ({ state }) => {
          const nodeDefUuidSibling = getSiblingNodeDefUuid({ state, offset })
          if (editingNodeDefInFullScreen) {
            const nodeDef = State.getNodeDef(state)
            const nodeDefModule = NodeDef.isAnalysis(nodeDef) ? analysisModules.nodeDef : designerModules.nodeDef
            // wait for local state to reset and navigate to the next node def
            setTimeout(() => {
              navigate(`${appModuleUri(nodeDefModule)}${nodeDefUuidSibling}/`, { replace: true })
            }, 100)
          } else {
            dispatch(SurveyFormActions.setFormActiveNodeDefUuid(nodeDefUuidSibling))
          }
        },
      })
    },
    [cancelEdits, dispatch, editingNodeDefInFullScreen, getSiblingNodeDefUuid, navigate]
  )
}
