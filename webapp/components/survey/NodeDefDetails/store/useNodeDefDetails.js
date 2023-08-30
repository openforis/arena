import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useIsDesignerNodeDefRoute, useOnUpdate, useOnBrowserBack, useOnPageUnload } from '@webapp/components/hooks'

import { appModuleUri, analysisModules } from '@webapp/app/appModules'
import { useNodeDefByUuid, useSurveyCycleKey } from '@webapp/store/survey'

import { useActions } from './actions'
import { State } from './state'
import { useNodeDefValidationByUuid } from '@webapp/store/survey/hooks'

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
