import './DataQueriesPanel.scss'

import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { DataQuerySummaries, UUIDs } from '@openforis/arena-core'

import * as API from '@webapp/service/api'
import { useSurveyId, useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import PanelRight from '@webapp/components/PanelRight'
import Table from '@webapp/components/Table'

import { DataQueryEditForm } from './DataQueryEditForm'

const DataQueriesPanel = (props) => {
  const { onClose, onChangeQuery, query, selectedQuerySummaryUuid, setSelectedQuerySummaryUuid } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()
  const surveyId = useSurveyId()

  const [editedQuerySummary, setEditedQuerySummary] = useState({})

  const fetchAndSetEditedQuerySummary = useCallback(
    async ({ querySummaryUuid }) => {
      const querySummaryFetched = await API.fetchDataQuerySummary({ surveyId, querySummaryUuid })
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
    setEditedQuerySummary(DataQuerySummaries.create({ content: query }))
    setSelectedQuerySummaryUuid(null)
  }, [query])

  const onSave = useCallback(async () => {
    if (!DataQuerySummaries.getUuid(editedQuerySummary)) {
      const querySummaryToInsert = { ...editedQuerySummary, uuid: UUIDs.v4(), content: query }
      const insertedDataQuerySummary = await API.insertDataQuerySummary({
        surveyId,
        querySummary: querySummaryToInsert,
      })
      setEditedQuerySummary(insertedDataQuerySummary)
    } else {
      await API.updateDataQuerySummary({ surveyId, querySummary: editedQuerySummary })
    }
  }, [editedQuerySummary, query, surveyId])

  const onTableRowClick = useCallback(
    async (selectedQuerySummary) => {
      const querySummaryUuid = DataQuerySummaries.getUuid(selectedQuerySummary)
      setSelectedQuerySummaryUuid(querySummaryUuid)
      fetchAndSetEditedQuerySummary({ querySummaryUuid })
    },
    [fetchAndSetEditedQuerySummary, setSelectedQuerySummaryUuid]
  )

  const columns = useMemo(
    () => [
      { key: 'position', header: '#', renderItem: ({ itemPosition }) => itemPosition, width: '50px' },
      {
        key: 'name',
        header: 'common.name',
        renderItem: ({ item }) => DataQuerySummaries.getName(item),
        width: '1fr',
      },
      {
        key: 'label',
        header: 'common.label',
        renderItem: ({ item }) => DataQuerySummaries.getLabel(lang)(item),
        width: '1fr',
      },
    ],
    []
  )

  return (
    <PanelRight className="data-queries-panel" onClose={onClose} width="50vw" header={i18n.t('queries')}>
      <DataQueryEditForm
        onNew={onNew}
        onSave={onSave}
        querySummary={editedQuerySummary}
        setQuerySummary={setEditedQuerySummary}
      />

      <Table
        className="data-queries-table"
        module="data_queries"
        columns={columns}
        isRowActive={isTableRowActive}
        onRowClick={onTableRowClick}
        selectable
      />
    </PanelRight>
  )
}

export default DataQueriesPanel
