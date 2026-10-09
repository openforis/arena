import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import { Query } from '@common/model/query'

import { Button } from '@webapp/components/buttons'
import { isAiFeatureShown, isAiFeatureUsable } from '@webapp/ai/policy/aiFeatureAvailability'
import { AiPolicyBlockedTooltip } from '@webapp/components/ai/AiPolicyBlockedTooltip'
import { useAiFeatureAvailability } from '@webapp/components/ai/hooks/useAiFeatureAvailability'
import { useNotifyInfo } from '@webapp/components/hooks'
import { DataExplorerActions, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { DialogConfirmActions } from '@webapp/store/ui'

import type { AiDataQueryGenerateResult } from '@webapp/ai/workflows'

import { State } from '../store'
import { AiGenerateQueryPopup } from './AiGenerateQueryPopup'

type Props = {
  disabled?: boolean
  state: object
  Actions: Record<string, () => void>
}

export const ButtonAiGenerateQuery = (props: Props) => {
  const { disabled = false, state, Actions } = props

  const dispatch = useDispatch<ThunkDispatch<any, any, UnknownAction>>()
  const availability = useAiFeatureAvailability('dataQueryGenerate')
  const query = DataExplorerSelectors.useQuery()
  const notifyInfo = useNotifyInfo()

  const applyGeneratedQuery = useCallback(
    ({ query: queryGenerated, explanation }: AiDataQueryGenerateResult) => {
      dispatch(DataExplorerActions.showQuery({ query: queryGenerated }))
      Actions.closePanels()
      notifyInfo({ key: 'dataView:dataQuery.ai.generatedSuccessfully', params: { explanation } })
    },
    [Actions, dispatch, notifyInfo]
  )

  const onGenerated = useCallback(
    (result: AiDataQueryGenerateResult) => {
      if (Query.hasSelection(query)) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'dataView:dataQuery.ai.replaceQueryConfirmMessage',
            onOk: () => applyGeneratedQuery(result),
          })
        )
      } else {
        applyGeneratedQuery(result)
      }
    },
    [applyGeneratedQuery, dispatch, query]
  )

  if (!isAiFeatureShown(availability)) return null

  return (
    <>
      <AiPolicyBlockedTooltip availability={availability}>
        <Button
          className="btn-s btn-ai"
          disabled={disabled || !isAiFeatureUsable(availability)}
          iconClassName="icon-magic-wand icon-14px"
          label="dataView:dataQuery.ai.button"
          onClick={Actions.togglePanelAi}
          title="dataView:dataQuery.ai.buttonTitle"
          variant="outlined"
        />
      </AiPolicyBlockedTooltip>
      {State.isPanelAiShown(state) && <AiGenerateQueryPopup onClose={Actions.closePanels} onGenerated={onGenerated} />}
    </>
  )
}
