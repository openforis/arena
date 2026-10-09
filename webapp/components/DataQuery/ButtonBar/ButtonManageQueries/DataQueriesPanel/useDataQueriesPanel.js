import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import * as A from '@core/arena'
import { DataQuerySummaries, Objects } from '@openforis/arena-core'

import { Query } from '@common/model/query'
import * as Validation from '@core/validation/validation'

import { AiWorkflows, getAiErrorMessage, isAiAbortError } from '@webapp/ai/workflows'
import * as API from '@webapp/service/api'
import { useNotifyError } from '@webapp/components/hooks'
import { DataExplorerActions, DataExplorerHooks, DataExplorerSelectors } from '@webapp/store/dataExplorer'
import { useSurvey, useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'
import { DialogConfirmActions, NotificationActions } from '@webapp/store/ui'

import { DataQuerySummaryValidator } from './DataQuerySummaryValidator'

/**
 * Returns the given name, or the first "name_N" (N = 2, 3, ...) not used by any of the given query summaries.
 * @param {object} params - The parameters.
 * @param {string} params.name - The name.
 * @param {object[]} params.dataQuerySummaries - The existing query summaries.
 * @returns {string} - The unique name.
 */
const toUniqueName = ({ name, dataQuerySummaries }) => {
  const existingNames = new Set(dataQuerySummaries.map((querySummary) => DataQuerySummaries.getName(querySummary)))
  let uniqueName = name
  let index = 2
  while (existingNames.has(uniqueName)) {
    uniqueName = `${name}_${index}`
    index++
  }
  return uniqueName
}

export const useDataQueriesPanel = () => {
  const dispatch = useDispatch()
  const i18n = useI18n()
  const survey = useSurvey()
  const surveyId = useSurveyId()
  const lang = useSurveyPreferredLang()
  const notifyError = useNotifyError()
  const onChangeQuery = DataExplorerHooks.useSetQuery()

  const query = DataExplorerSelectors.useQuery()
  const selectedQuerySummaryUuid = DataExplorerSelectors.useSelectedQuerySummaryUuid()

  const [state, setState] = useState(() => ({
    editedQuerySummary: {},
    fetchedQuerySummary: null,
    dataQuerySummaries: [],
    queriesRequestedAt: Date.now(),
    validating: false,
    summarizing: false,
  }))
  const { editedQuerySummary, fetchedQuerySummary, dataQuerySummaries, queriesRequestedAt, validating, summarizing } =
    state

  const draft =
    !Objects.isEqual(fetchedQuerySummary, editedQuerySummary) ||
    !Objects.isEqual(DataQuerySummaries.getContent(editedQuerySummary), query)

  const validateEditedQuerySummary = useCallback(
    async (querySummaryUpdated) => {
      setState((statePrev) => ({ ...statePrev, validating: true }))
      const validation = await DataQuerySummaryValidator.validate({
        dataQuerySummary: querySummaryUpdated,
        dataQuerySummaries,
      })
      const querySummaryWithValidation = Validation.assocValidation(validation)(querySummaryUpdated)
      setState((statePrev) => ({ ...statePrev, editedQuerySummary: querySummaryWithValidation, validating: false }))
      return validation
    },
    [dataQuerySummaries]
  )

  const setEditedQuerySummary = useCallback(
    async (querySummaryUpdated) => {
      setState((statePrev) => ({ ...statePrev, editedQuerySummary: querySummaryUpdated }))
      await validateEditedQuerySummary(querySummaryUpdated)
    },
    [validateEditedQuerySummary]
  )

  const resetState = useCallback(() => {
    setState((statePrev) => ({
      ...statePrev,
      editedQuerySummary: {},
      fetchedQuerySummary: null,
      queriesRequestedAt: Date.now(),
    }))
    dispatch(DataExplorerActions.setSelectedQuerySummaryUuid(null))
  }, [dispatch])

  const fetchDataQuerySummaries = useCallback(async () => {
    const dataQuerySummaries = await API.fetchDataQuerySummaries({
      surveyId,
      excludedUuid: selectedQuerySummaryUuid,
    })
    setState((statePrev) => ({ ...statePrev, dataQuerySummaries }))
  }, [selectedQuerySummaryUuid, surveyId])

  const fetchAndSetEditedQuerySummary = useCallback(
    async ({ querySummaryUuid, updateQuery = false }) => {
      const querySummaryFetched = await API.fetchDataQuerySummary({ surveyId, querySummaryUuid })
      setState((statePrev) => ({
        ...statePrev,
        fetchedQuerySummary: querySummaryFetched,
        editedQuerySummary: querySummaryFetched,
      }))
      if (updateQuery) {
        const fetchedQuery = DataQuerySummaries.getContent(querySummaryFetched)
        onChangeQuery(fetchedQuery)
      }
    },
    [onChangeQuery, surveyId]
  )

  // on load, fetch queries and set selected query in form (if any)
  useEffect(() => {
    if (selectedQuerySummaryUuid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set after the fetch completes
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
    if (validating) return

    const validationUpdated = Validation.hasValidation(editedQuerySummary)
      ? Validation.getValidation(editedQuerySummary)
      : await validateEditedQuerySummary(editedQuerySummary)

    if (Validation.isNotValid(validationUpdated)) {
      dispatch(NotificationActions.notifyWarning({ key: 'common.formContainsErrorsCannotSave', timeout: 3000 }))
      return
    }
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
      dispatch(DataExplorerActions.setSelectedQuerySummaryUuid(DataQuerySummaries.getUuid(querySummaryToInsert)))
    }
    setState((statePrev) => ({
      ...statePrev,
      editedQuerySummary: querySummaryFetchedUpdated,
      fetchedQuerySummary: querySummaryFetchedUpdated,
      queriesRequestedAt: Date.now(),
    }))
  }, [dispatch, editedQuerySummary, query, surveyId, validateEditedQuerySummary, validating])

  // fills name, label and description (in the preferred language) with the ones suggested by the AI
  const onAiSuggestSummary = useCallback(async () => {
    if (summarizing) return
    setState((statePrev) => ({ ...statePrev, summarizing: true }))
    try {
      const { name, label, description } = await AiWorkflows.summarizeDataQuery({ survey, surveyId, query, lang })
      const querySummaryUpdated = A.pipe(
        DataQuerySummaries.assocName(toUniqueName({ name, dataQuerySummaries })),
        DataQuerySummaries.assocLabels({ ...DataQuerySummaries.getLabels(editedQuerySummary), [lang]: label }),
        DataQuerySummaries.assocDescriptions({
          ...DataQuerySummaries.getDescriptions(editedQuerySummary),
          [lang]: description,
        })
      )(editedQuerySummary)
      await setEditedQuerySummary(querySummaryUpdated)
    } catch (error) {
      if (!isAiAbortError(error)) {
        notifyError({
          key: 'dataView:dataQuery.ai.suggestSummaryFailed',
          params: { message: getAiErrorMessage({ error, i18n }) },
        })
      }
    } finally {
      setState((statePrev) => ({ ...statePrev, summarizing: false }))
    }
  }, [
    dataQuerySummaries,
    editedQuerySummary,
    i18n,
    lang,
    notifyError,
    query,
    setEditedQuerySummary,
    summarizing,
    survey,
    surveyId,
  ])

  const doDelete = useCallback(async () => {
    const querySummaryUuid = DataQuerySummaries.getUuid(editedQuerySummary)
    await API.deleteDataQuerySummary({ surveyId, querySummaryUuid })
    resetState()
  }, [editedQuerySummary, resetState, surveyId])

  const onDelete = useCallback(() => {
    dispatch(
      DialogConfirmActions.showDialogConfirm({
        key: 'dataView:dataQuery.deleteConfirmMessage',
        params: { name: DataQuerySummaries.getName(editedQuerySummary) },
        onOk: doDelete,
      })
    )
  }, [dispatch, doDelete, editedQuerySummary])

  const doQuerySummarySelection = useCallback(
    async (selectedQuerySummary) => {
      const querySummaryUuid = DataQuerySummaries.getUuid(selectedQuerySummary)
      dispatch(DataExplorerActions.setSelectedQuerySummaryUuid(querySummaryUuid))
      await fetchAndSetEditedQuerySummary({ querySummaryUuid, updateQuery: true })
    },
    [dispatch, fetchAndSetEditedQuerySummary]
  )

  const onTableRowClick = useCallback(
    async (selectedQuerySummary) => {
      if (Query.hasSelection(query)) {
        dispatch(
          DialogConfirmActions.showDialogConfirm({
            key: 'dataView:dataQuery.replaceQueryConfirmMessage',
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
    onAiSuggestSummary,
    onNew,
    onSave,
    onDelete,
    onTableRowClick,
    query,
    queriesRequestedAt,
    setEditedQuerySummary,
    summarizing,
    validating,
  }
}
