import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { DataQuerySummaries, Objects } from '@openforis/arena-core'

import { Query } from '@common/model/query'
import * as Validation from '@core/validation/validation'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'
import { DataQuerySummaryValidator } from './DataQuerySummaryValidator'

export const useDataQueriesPanel = ({
  query,
  onChangeQuery,
  selectedQuerySummaryUuid,
  setSelectedQuerySummaryUuid,
}) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const [state, setState] = useState({
    editedQuerySummary: {},
    fetchedQuerySummary: null,
    dataQuerySummaries: [],
    queriesRequestedAt: Date.now(),
  })
  const { editedQuerySummary, fetchedQuerySummary, dataQuerySummaries, queriesRequestedAt } = state

  const draft =
    !Objects.isEqual(fetchedQuerySummary, editedQuerySummary) ||
    !Objects.isEqual(DataQuerySummaries.getContent(editedQuerySummary), query)

  const setEditedQuerySummary = useCallback(
    async (querySummaryUpdated) => {
      const validation = await DataQuerySummaryValidator.validate({
        dataQuerySummary: querySummaryUpdated,
        dataQuerySummaries,
      })
      const querySummaryWithValidation = Validation.assocValvalidationidation(validation)(querySummaryUpdated)
      setState((statePrev) => ({ ...statePrev, editedQuerySummary: querySummaryWithValidation }))
    },
    [dataQuerySummaries]
  )

  const resetState = useCallback(() => {
    setState((statePrev) => ({
      ...statePrev,
      editedQuerySummary: {},
      fetchedQuerySummary: null,
      queriesRequestedAt: Date.now(),
    }))
    setSelectedQuerySummaryUuid(null)
  }, [setSelectedQuerySummaryUuid])

  const fetchDataQuerySummaries = useCallback(async () => {
    const dataQuerySummaries = await API.fetchDataQuerySummaries({
      surveyId,
      excludedUuid: selectedQuerySummaryUuid,
    })
    setState((statePrev) => ({ ...statePrev, dataQuerySummaries }))
  }, [selectedQuerySummaryUuid, surveyId])

  const fetchAndSetEditedQuerySummary = useCallback(
    async ({ querySummaryUuid }) => {
      const querySummaryFetched = await API.fetchDataQuerySummary({ surveyId, querySummaryUuid })
      setState((statePrev) => ({
        ...statePrev,
        fetchedQuerySummary: querySummaryFetched,
        editedQuerySummary: querySummaryFetched,
      }))
      const fetchedQuery = DataQuerySummaries.getContent(querySummaryFetched)
      onChangeQuery(fetchedQuery)
    },
    [onChangeQuery, surveyId]
  )

  useEffect(() => {
    if (selectedQuerySummaryUuid) {
      fetchAndSetEditedQuerySummary({ querySummaryUuid: selectedQuerySummaryUuid })
    }
    fetchDataQuerySummaries()
  }, [fetchAndSetEditedQuerySummary, fetchDataQuerySummaries, selectedQuerySummaryUuid])

  const isTableRowActive = useCallback(
    (row) => DataQuerySummaries.getUuid(row) === selectedQuerySummaryUuid,
    [selectedQuerySummaryUuid]
  )

  const onNew = useCallback(() => {
    resetState()
  }, [resetState])

  const onSave = useCallback(async () => {
    let querySummaryFetchedUpdated = null
    if (DataQuerySummaries.getUuid(editedQuerySummary)) {
      const querySummaryToUpdate = DataQuerySummaries.assocContent(query)(editedQuerySummary)
      const querySummaryUpdated = await API.updateDataQuerySummary({ surveyId, querySummary: querySummaryToUpdate })
      querySummaryFetchedUpdated = DataQuerySummaries.assocContent(query)(querySummaryUpdated)
    } else {
      const querySummaryToInsert = DataQuerySummaries.create({
        content: query,
        props: editedQuerySummary.props,
      })
      const insertedDataQuerySummary = await API.insertDataQuerySummary({
        surveyId,
        querySummary: querySummaryToInsert,
      })
      querySummaryFetchedUpdated = DataQuerySummaries.assocContent(query)(insertedDataQuerySummary)
      setSelectedQuerySummaryUuid(DataQuerySummaries.getUuid(querySummaryToInsert))
    }
    setState((statePrev) => ({
      ...statePrev,
      editedQuerySummary: querySummaryFetchedUpdated,
      fetchedQuerySummary: querySummaryFetchedUpdated,
      queriesRequestedAt: Date.now(),
    }))
  }, [editedQuerySummary, query, setSelectedQuerySummaryUuid, surveyId])

  const doDelete = useCallback(async () => {
    const querySummaryUuid = DataQuerySummaries.getUuid(editedQuerySummary)
    await API.deleteDataQuerySummary({ surveyId, querySummaryUuid })
    resetState()
  }, [editedQuerySummary, resetState, surveyId])

  const onDelete = useCallback(() => {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'dataView.dataQuery.deleteConfirmMessage',
        params: { name: DataQuerySummaries.getName(editedQuerySummary) },
        onOk: doDelete,
      })
    )
  }, [dispatch, doDelete, editedQuerySummary])

  const doQuerySummarySelection = useCallback(
    async (selectedQuerySummary) => {
      const querySummaryUuid = DataQuerySummaries.getUuid(selectedQuerySummary)
      setSelectedQuerySummaryUuid(querySummaryUuid)
      await fetchAndSetEditedQuerySummary({ querySummaryUuid })
    },
    [fetchAndSetEditedQuerySummary, setSelectedQuerySummaryUuid]
  )

  const onTableRowClick = useCallback(
    async (selectedQuerySummary) => {
      if (Query.hasSelection(query)) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'dataView.dataQuery.replaceQueryConfirmMessage',
            params: { name: DataQuerySummaries.getName(editedQuerySummary) },
            onOk: async () => doQuerySummarySelection(selectedQuerySummary),
          })
        )
      } else {
        await doQuerySummarySelection(selectedQuerySummary)
      }
    },
    [dispatch, doQuerySummarySelection, editedQuerySummary, query]
  )

  return {
    draft,
    editedQuerySummary,
    isTableRowActive,
    onNew,
    onSave,
    onDelete,
    onTableRowClick,
    queriesRequestedAt,
    setEditedQuerySummary,
  }
}
