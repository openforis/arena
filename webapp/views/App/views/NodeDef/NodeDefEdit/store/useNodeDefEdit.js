import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { matchPath, useHistory, useLocation, useParams } from 'react-router'

import * as Survey from '@core/survey/survey'
import * as NodeDef from '@core/survey/nodeDef'

import { useOnUpdate } from '@webapp/components/hooks'
import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import { navigateToChainsView } from '@webapp/loggedin/modules/analysis/chain/actions'

import * as NodeDefState from './state'
import * as NodeDefStorage from './storage'

export const useNodeDefEdit = () => {
  const { nodeDefUuid } = useParams()

  const dispatch = useDispatch()
  const history = useHistory()
  const { pathname } = useLocation()

  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()

  const [nodeDefState, setNodeDefState] = useState({})

  const editingNodeDefFromDesigner = Boolean(
    matchPath(pathname, `${appModuleUri(designerModules.nodeDef)}:nodeDefUuid`)
  )

  useEffect(() => {
    // Editing a nodeDef
    if (nodeDefUuid) {
      const nodeDefStateStored = NodeDefStorage.getNodeDefState()
      if (nodeDefStateStored) {
        if (NodeDef.getUuid(NodeDefState.getNodeDef(nodeDefStateStored)) === nodeDefUuid) {
          setNodeDefState(nodeDefStateStored)
        } else {
          NodeDefStorage.clearNodeDefState()
        }
      } else {
        const nodeDef = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
        const validation = Survey.getNodeDefValidation(nodeDef)(survey)
        setNodeDefState(NodeDefState.createNodeDefState({ nodeDef, validation }))
      }
    }
  }, [])

  useOnUpdate(() => {
    if (editingNodeDefFromDesigner) {
      history.goBack()
    } else {
      dispatch(navigateToChainsView(history))
    }
  }, [surveyCycleKey])

  return {
    nodeDefState,
    setNodeDefState,
    editingNodeDefFromDesigner,
  }
}
