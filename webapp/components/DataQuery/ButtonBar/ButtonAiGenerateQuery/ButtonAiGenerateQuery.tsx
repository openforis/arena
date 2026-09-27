import React, { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import { Query } from '@common/model/query'

import { Button } from '@webapp/components/buttons'
import { useAiFeatureEnabled } from '@webapp/components/ai/hooks/useAiFeatureEnabled'
import * as ExpressionParser from '@webapp/components/expression/expressionParser'
import { useNotifyInfo } from '@webapp/components/hooks'
import { DataExplorerActions, DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useSurveyPreferredLang } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'

import type { AiDataQueryGenerateResult } from '@webapp/service/api/ai/dataQuery'

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
  const enabled = useAiFeatureEnabled('dataQuery')
  const lang = useSurveyPreferredLang()
  const query = DataExplorerSelectors.useQuery()
  const onChangeQuery = DataExplorerHooks.useSetQuery()
  const notifyInfo = useNotifyInfo()

  const applyGeneratedQuery = useCallback(
    ({ query: queryGenerated, summary, explanation }: AiDataQueryGenerateResult) => {
      const filter = Query.getFilter(queryGenerated)
      const queryToApply = filter
        ? Query.assocFilter(ExpressionParser.normalize({ expr: filter, canBeCall: true }))(queryGenerated)
        : queryGenerated

      dispatch(DataExplorerActions.setSelectedQuerySummaryUuid(null))
      dispatch(DataExplorerActions.setNodeDefsSelectorVisible(true))
      dispatch(
        DataExplorerActions.setQuerySummaryDraft({
          name: summary.name,
          labels: summary.label ? { [lang]: summary.label } : {},
          descriptions: summary.description ? { [lang]: summary.description } : {},
        })
      )
      onChangeQuery(queryToApply)
      // open the queries panel (prefilled with the suggested name, label and description) and close the AI popup
      Actions.togglePanelQueries()
      notifyInfo({ key: 'dataView:dataQuery.ai.generatedSuccessfully', params: { explanation } })
    },
    [Actions, dispatch, lang, notifyInfo, onChangeQuery]
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

  if (!enabled) return null

  return (
    <>
      <Button
        className="btn-s btn-ai"
        disabled={disabled}
        iconClassName="icon-magic-wand icon-14px"
        label="dataView:dataQuery.ai.button"
        onClick={Actions.togglePanelAi}
        title="dataView:dataQuery.ai.buttonTitle"
        variant="outlined"
      />
      {State.isPanelAiShown(state) && <AiGenerateQueryPopup onClose={Actions.closePanels} onGenerated={onGenerated} />}
    </>
  )
}
