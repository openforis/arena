import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { matchPath, useHistory, useLocation, useParams } from 'react-router'

import * as Survey from '@core/survey/survey'

import { useOnUpdate } from '@webapp/components/hooks'
import { appModuleUri, designerModules } from '@webapp/app/appModules'
import { useSurvey, useSurveyCycleKey } from '@webapp/store/survey'

import { navigateToChainsView } from '@webapp/loggedin/modules/analysis/chain/actions'

import { useActions } from './actions'
import * as State from './state'

export const useNodeDefDetails = () => {
  const { nodeDefUuid } = useParams()

  const dispatch = useDispatch()
  const history = useHistory()
  const { pathname } = useLocation()

  const survey = useSurvey()
  const surveyCycleKey = useSurveyCycleKey()

  const [state, setState] = useState({})

  const Actions = useActions({ state, setState })

  const editingFromDesigner = Boolean(matchPath(pathname, `${appModuleUri(designerModules.nodeDef)}:nodeDefUuid`))

  useEffect(() => {
    // Editing a nodeDef
    if (nodeDefUuid) {
      const nodeDefSurvey = Survey.getNodeDefByUuid(nodeDefUuid)(survey)
      const validation = Survey.getNodeDefValidation(nodeDefSurvey)(survey)
      setState(State.create({ nodeDef: nodeDefSurvey, validation }))
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
    state,
    Actions,
    editingFromDesigner,
  }
}
