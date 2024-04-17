import './DataQueriesPanel.scss'

import React, { useMemo } from 'react'

import { DataQuerySummaries } from '@openforis/arena-core'

import { Query } from '@common/model/query'

import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import PanelRight from '@webapp/components/PanelRight'
import Table from '@webapp/components/Table'

import { DataQueryEditForm } from './DataQueryEditForm'
import { useDataQueriesPanel } from './useDataQueriesPanel'

const dataQueriesModuleName = 'data_queries'

const DataQueriesPanel = (props) => {
  const { onClose, onChangeQuery, query } = props

  const {
    draft,
    isTableRowActive,
    onNew,
    onSave,
    onDelete,
    editedQuerySummary,
    setEditedQuerySummary,
    onTableRowClick,
    queriesRequestedAt,
    validating,
  } = useDataQueriesPanel({
    query,
    onChangeQuery,
  })

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

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
    [lang]
  )

  return (
    <PanelRight
      className="data-queries-panel"
      onClose={onClose}
      width="50vw"
      header={i18n.t('dataView.dataQuery.manageQueries')}
    >
      {Query.hasSelection(query) && (
        <DataQueryEditForm
          draft={draft}
          onDelete={onDelete}
          onNew={onNew}
          onSave={onSave}
          querySummary={editedQuerySummary}
          setQuerySummary={setEditedQuerySummary}
          validating={validating}
        />
      )}
      <Table
        className="data-queries-table"
        columns={columns}
        isRowActive={isTableRowActive}
        module={dataQueriesModuleName}
        onRowClick={onTableRowClick}
        restParams={{ requestedAt: queriesRequestedAt }}
        selectable
        showFooter={false}
      />
    </PanelRight>
  )
}

export default DataQueriesPanel
