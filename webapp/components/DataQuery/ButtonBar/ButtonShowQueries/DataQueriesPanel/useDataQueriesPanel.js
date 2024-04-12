import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { DataQuerySummaries, Objects } from '@openforis/arena-core'

import { Query } from '@common/model/query'

import * as API from '@webapp/service/api'
import { useSurveyId } from '@webapp/store/survey'
import { DialogConfirmActions } from '@webapp/store/ui'

export const useDataQueriesPanel = ({
  query,
  onChangeQuery,
  selectedQuerySummaryUuid,
  setSelectedQuerySummaryUuid,
}) => {
  const dispatch = useDispatch()
  const surveyId = useSurveyId()
  const [fetchedQuerySummary, setFetchedQuerySummary] = useState(null)
  const [editedQuerySummary, setEditedQuerySummary] = useState({})
  const [queriesRequestedAt, setQueriesRequestedAt] = useState(Date.now())

  const draft =
    !Objects.isEqual(fetchedQuerySummary, editedQuerySummary) ||
    !Objects.isEqual(DataQuerySummaries.getContent(fetchedQuerySummary), query)

  const fetchAndSetEditedQuerySummary = useCallback(
    async ({ querySummaryUuid }) => {
      const querySummaryFetched = await API.fetchDataQuerySummary({ surveyId, querySummaryUuid })
      setFetchedQuerySummary(querySummaryFetched)
      setEditedQuerySummary(querySummaryFetched)
      const fetchedQuery = DataQuerySummaries.getContent(querySummaryFetched)
      onChangeQuery(fetchedQuery)
    },
    [onChangeQuery, surveyId]
  )

  useEffect(() => {
    if (selectedQuerySummaryUuid) {
      fetchAndSetEditedQuerySummary({ querySummaryUuid: selectedQuerySummaryUuid })
    }
  }, [fetchAndSetEditedQuerySummary, selectedQuerySummaryUuid])

  const isTableRowActive = useCallback(
    (row) => DataQuerySummaries.getUuid(row) === selectedQuerySummaryUuid,
    [selectedQuerySummaryUuid]
  )

  const onNew = useCallback(() => {
    setEditedQuerySummary({})
    setSelectedQuerySummaryUuid(null)
  }, [setSelectedQuerySummaryUuid])

  const onSave = useCallback(async () => {
    if (DataQuerySummaries.getUuid(editedQuerySummary)) {
      const querySummaryToUpdate = DataQuerySummaries.assocContent(query)(editedQuerySummary)
      await API.updateDataQuerySummary({ surveyId, querySummary: querySummaryToUpdate })
    } else {
      const querySummaryToInsert = DataQuerySummaries.create({
        content: query,
        props: editedQuerySummary.props,
      })
      const insertedDataQuerySummary = await API.insertDataQuerySummary({
        surveyId,
        querySummary: querySummaryToInsert,
      })
      setEditedQuerySummary(insertedDataQuerySummary)
      setSelectedQuerySummaryUuid(DataQuerySummaries.getUuid(querySummaryToInsert))
    }
    setQueriesRequestedAt(Date.now())
  }, [editedQuerySummary, query, setSelectedQuerySummaryUuid, surveyId])

  const doDelete = useCallback(async () => {
    const querySummaryUuid = DataQuerySummaries.getUuid(editedQuerySummary)
    await API.deleteDataQuerySummary({ surveyId, querySummaryUuid })
    setQueriesRequestedAt(Date.now())
    setEditedQuerySummary({})
    setSelectedQuerySummaryUuid(null)
  }, [editedQuerySummary, setSelectedQuerySummaryUuid, surveyId])

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
