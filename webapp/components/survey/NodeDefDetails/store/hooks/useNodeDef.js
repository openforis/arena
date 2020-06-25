import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { matchPath, useHistory, useLocation, useParams } from 'react-router'

import * as Survey from '@core/survey/survey'

import { useOnUpdate } from '@webapp/components/hooks'
import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useSurvey, useSurveyCycleKey, useNodeDefParentByUuid } from '@webapp/store/survey'

import { navigateToChainsView } from '@webapp/loggedin/modules/analysis/chain/actions'

import * as NodeDefState from '../state'
import { useIsKeyEditDisabled } from './useKeyEditDisabled'
import { useIsMultipleEditDisabled } from './useMultipleEditDisabled'

export const useNodeDef = () => {
  const { nodeDefUuid } = useParams()

  const dispatch = useDispatch()
  const history = useHistory()
  const { pathname } = useLocation()

  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()

  const [nodeDefState, setNodeDefState] = useState({})

  const editingFromDesigner = Boolean(matchPath(pathname, `${appModuleUri(designerModules.nodeDef)}:nodeDefUuid`))

  const nodeDef = NodeDefState.getNodeDef(nodeDefState)
  const keyEditDisabled = useIsKeyEditDisabled({ nodeDef })
  const multipleEditDisabled = useIsMultipleEditDisabled({ nodeDef })
  const nodeDefParent = useNodeDefParentByUuid(nodeDefUuid)

  useEffect(() => {
    // Editing a nodeDef
    if (nodeDefUuid) {
      const nodeDefSurvey = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const validation = Survey.getNodeDefValidation(nodeDefSurvey)(survey)
      setNodeDefState(NodeDefState.createNodeDefState({ nodeDef: nodeDefSurvey, validation }))
    }
  }, [])

  useOnUpdate(() => {
    if (editingFromDesigner) {
      history.goBack()
    } else {
      dispatch(navigateToChainsView(history))
    }
  }, [surveyCycleKey])

  return {
    nodeDefState,
    setNodeDefState,
    survey,
    surveyCycleKey,
    nodeDefParent,
    editingFromDesigner,
    keyEditDisabled,
    multipleEditDisabled,
  }
}
