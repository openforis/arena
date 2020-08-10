import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useHistory } from 'react-router'

import * as NodeDef from '@core/survey/nodeDef'
import * as Survey from '@core/survey/survey'

import * as Step from '@common/analysis/processingStep'

import { analysisModules, appModuleUri } from '@webapp/app/appModules'
import { NodeDefsActions, useSurveyInfo } from '@webapp/store/survey'
import { AnalysisStorage } from '@webapp/service/storage/analysis'
import { useUpdateProps } from './step/useUpdateProps'

export const useAddEntityVirtual = ({ setState }) => {
  const surveyInfo = useSurveyInfo()
  const dispatch = useDispatch()
  const history = useHistory()
  const updatePropsStep = useUpdateProps({ setState })

  return useCallback(async ({ state }) => {
    const nodeDef = NodeDef.newNodeDef(
      null,
      NodeDef.nodeDefType.entity,
      Survey.getCycleKeys(surveyInfo),
      { [NodeDef.propKeys.multiple]: true },
      {},
      true,
      true
    )
    const nodeDefUuid = NodeDef.getUuid(nodeDef)
    await dispatch({ type: NodeDefsActions.nodeDefCreate, nodeDef })
    const stateUpdated = updatePropsStep({
      props: {
        [Step.keysProps.entityUuid]: nodeDefUuid,
      },
      state,
    })
    AnalysisStorage.persistChainEdit(stateUpdated)
    history.push(`${appModuleUri(analysisModules.nodeDef)}${nodeDefUuid}/`)
  }, [])
}
