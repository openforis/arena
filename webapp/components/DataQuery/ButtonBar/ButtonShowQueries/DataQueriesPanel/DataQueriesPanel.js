import React, { useCallback } from 'react'

// import { DataQuerySummaries } from '@openforis/arena-server'

import PanelRight from '@webapp/components/PanelRight'
import Table from '@webapp/components/Table'

import { useSurveyPreferredLang } from '@webapp/store/survey'
import { useI18n } from '@webapp/store/system'

import { DataQueryEditForm } from './DataQueryEditForm'

const DataQueriesPanel = (props) => {
  const { editedQuerySummary, onClose, query } = props

  const i18n = useI18n()
  const lang = useSurveyPreferredLang()

  const onSave = useCallback(() => {}, [])

  const columns = []
  // const columns = [
  //   { key: 'position', header: '#', renderItem: ({ itemPosition }) => itemPosition, width: '50px' },
  //   {
  //     key: 'name',
  //     header: 'common.name',
  //     renderItem: ({ item }) => DataQuerySummaries.getName(item),
  //     width: '1fr',
  //   },
  //   {
  //     key: 'label',
  //     header: 'common.label',
  //     renderItem: ({ item }) => DataQuerySummaries.getLabel(lang)(item),
  //     width: '1fr',
  //   },
  // ]

  return (
    <PanelRight onClose={onClose} width="50vw" header={i18n.t('queries')}>
      <div>
        <DataQueryEditForm dataQuerySummary={editedQuerySummary} onSave={onSave} />

        <Table module="data_queries" columns={columns} />
      </div>
    </PanelRight>
  )
}

export default DataQueriesPanel
