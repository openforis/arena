import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { useIsDesignerNodeDefRoute, useOnBrowserBack, useOnPageUnload, useOnUpdate } from '@webapp/components/hooks'
import { useNodeDefByUuid, useSurveyCycleKey } from '@webapp/store/survey'
import { useNodeDefValidationByUuid } from '@webapp/store/survey/hooks'

import { useActions } from './actions'
import { State } from './state'

export const useNodeDefDetails = () => {
  const { nodeDefUuid } = useParams()

  const navigate = useNavigate()

  const nodeDef = useNodeDefByUuid(nodeDefUuid)
  const validation = useNodeDefValidationByUuid(nodeDefUuid)
  const surveyCycleKey = useSurveyCycleKey()

  const [state, setState] = useState({})

  const Actions = useActions({ setState })

  const editingFromDesigner = useIsDesignerNodeDefRoute()

  useOnBrowserBack({
    active: State.isDirty(state),
    onBack: useCallback(() => Actions.cancelEdits({ state }), [state]),
  })

  useOnPageUnload({ active: State.isDirty(state) })

  // create initial state on mount
  useEffect(() => {
    // Editing a nodeDef
    if (nodeDefUuid) {
      setState(State.create({ nodeDef, validation }))
    }
  }, [nodeDefUuid])

  useOnUpdate(() => {
    if (editingFromDesigner) {
      navigate(-1)
    } else {
      navigate(appModuleUri(analysisModules.chains))
    }
  }, [surveyCycleKey])

  return {
    state,
    Actions,
    editingFromDesigner,
  }
}
