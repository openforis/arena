import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import {
  useIsDesignerNodeDefRoute,
  useOnUpdate,
  useOnBrowserBack,
  useOnPageUnload,
  useOnValueChange,
} from '@webapp/components/hooks'

import { appModuleUri, analysisModules } from '@webapp/app/appModules'
import { useNodeDefByUuid, useSurveyCycleKey } from '@webapp/store/survey'

import { useActions } from './actions'
import { State } from './state'
import { useNodeDefValidationByUuid } from '@webapp/store/survey/hooks'

export const useNodeDefDetails = (props) => {
  const { nodeDefUuid: nodeDefUuidProp } = props
  const { nodeDefUuid: nodeDefUuidParam } = useParams()

  const nodeDefUuid = nodeDefUuidProp ?? nodeDefUuidParam

  const navigate = useNavigate()

  const nodeDef = useNodeDefByUuid(nodeDefUuid)
  const validation = useNodeDefValidationByUuid(nodeDefUuid)
  const surveyCycleKey = useSurveyCycleKey()

  const [state, setState] = useState(() => (nodeDefUuid ? State.create({ nodeDef, validation }) : {}))

  const Actions = useActions({ setState })

  const editingFromDesigner = useIsDesignerNodeDefRoute()

  useOnBrowserBack({
    active: State.isDirty(state),
    onBack: useCallback(() => Actions.cancelEdits({ state }), [state]),
  })

  useOnPageUnload({ active: State.isDirty(state) })

  useOnValueChange(nodeDefUuid, (nodeDefUuidUpdated) => {
    // Editing a nodeDef
    if (nodeDefUuidUpdated) {
      setState(State.create({ nodeDef, validation }))
    }
  })

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
